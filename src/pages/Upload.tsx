import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { UploadZone } from "@/components/UploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Loader2, Upload as UploadIcon, FileText } from "lucide-react";
import { API_BASE_URL } from "@/lib/auth";
import { CHUNK_SIZE, uploadFileInChunks } from "@/lib/upload";

export const Upload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    textContent: '',
    categoryId: '833299f6-ff1c-4fde-804f-6d3b3877c76e', // Updated to the correct category ID
    language: 'english',
    releaseRights: ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setIsGettingLocation(false);
        toast({
          title: "Location retrieved!",
          description: "Your current location has been added to the upload.",
        });
      },
      (error: GeolocationPositionError) => { // Specify GeolocationPositionError type
        setIsGettingLocation(false);
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable it in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        }
        toast({
          title: "Location error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    );
  };

  const getMediaType = (file: File | null, textContent: string): string => {
    if (file) {
      if (file.type.startsWith('audio/')) return 'audio';
      if (file.type.startsWith('video/')) return 'video';
      if (file.type.startsWith('image/')) return 'image';
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.type === 'application/pdf') return 'text';
    } else if (textContent) {
      return 'text';
    }
    return 'other';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const mediaType = getMediaType(selectedFile, formData.textContent);

    // Validation
    if (!selectedFile && !formData.textContent) {
      setError('Please select a file to upload or enter text content.');
      return;
    }

    if (!formData.title || !formData.language || !formData.releaseRights || !formData.categoryId) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.description.length < 32) {
      setError('Description must be at least 32 characters long.');
      return;
    }

    if (mediaType === 'text' && !formData.textContent) {
      setError('Please provide text content for text media.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload content.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let fileToUpload = selectedFile;
      let uploadUuid: string = crypto.randomUUID();
      let totalChunks = 1;

      if (selectedFile) {
        uploadUuid = await uploadFileInChunks(selectedFile, token, setUploadProgress);
        totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
      } else if (formData.textContent && mediaType === 'text') {
        const textBlob = new Blob([formData.textContent], { type: 'text/plain' });
        const textFile = new File([textBlob], 'text-content.txt', { type: 'text/plain' });
        fileToUpload = textFile;
        uploadUuid = await uploadFileInChunks(textFile, token, setUploadProgress);
        totalChunks = 1;
      }

      // Get user ID
      let userId = localStorage.getItem('userId');
      if (!userId) {
        const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const meData = await meResponse.json();
        if (meResponse.ok && meData.id) {
          userId = meData.id;
          localStorage.setItem('userId', userId);
        } else {
          throw new Error('Failed to get user ID for upload.');
        }
      }

      // Finalize the upload
      const finalizeFormData = new URLSearchParams();
      finalizeFormData.append('title', formData.title);
      finalizeFormData.append('description', formData.description);
      if (formData.latitude) finalizeFormData.append('latitude', formData.latitude);
      if (formData.longitude) finalizeFormData.append('longitude', formData.longitude);
      finalizeFormData.append('category_id', formData.categoryId);
      finalizeFormData.append('user_id', userId);
      finalizeFormData.append('media_type', mediaType);
      finalizeFormData.append('upload_uuid', uploadUuid);
      finalizeFormData.append('filename', fileToUpload?.name || 'text-content.txt');
      finalizeFormData.append('total_chunks', totalChunks.toString());
      finalizeFormData.append('release_rights', formData.releaseRights);
      finalizeFormData.append('language', formData.language);
      finalizeFormData.append('use_uid_filename', 'false');

      const finalizeResponse = await fetch(`${API_BASE_URL}/records/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: finalizeFormData.toString()
      });

      if (!finalizeResponse.ok) {
        const errorData = await finalizeResponse.json();
        throw new Error(`Finalization failed: ${errorData.message || finalizeResponse.statusText}`);
      }

      const finalResult = await finalizeResponse.json(); // Capture the final result
      const recordId = finalResult.id; // Assuming the record ID is also in the response

      setUploadProgress(100);
      toast({
        title: "Upload successful!",
        description: "Your contribution has been recorded successfully.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        latitude: '',
        longitude: '',
        textContent: '',
        categoryId: '833299f6-ff1c-4fde-804f-6d3b3877c76e', // Reset to the correct category ID
        language: 'english',
        releaseRights: '' // Reset to empty string
      });
      setSelectedFile(null);
      setUploadProgress(0);

    } catch (error: unknown) { // Specify unknown type for catch clause variable
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation isAuthenticated={true} />
      
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
              Upload Your Contribution
            </h1>
            <p className="text-lg text-muted-foreground">
              Share your food-related content to help build the corpus
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* File Upload Section */}
            <Card className="card-glass shadow-soft animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="h-5 w-5 text-primary" />
                  Choose Your Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UploadZone
                  onFileSelect={setSelectedFile}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                />
                
                {/* Text Content Alternative */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px bg-border flex-1" />
                    <span className="text-sm text-muted-foreground">OR</span>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="textContent" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Text Content
                    </Label>
                    <Textarea
                      id="textContent"
                      placeholder="Enter your text content here (recipes, food descriptions, etc.)"
                      value={formData.textContent}
                      onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                      className="min-h-32"
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata Section */}
            <Card className="card-glass shadow-soft animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle>Content Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="animate-scale-in">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter a descriptive title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      disabled={isUploading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language *</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                      disabled={isUploading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                        <SelectItem value="telugu">Telugu</SelectItem>
                        <SelectItem value="tamil">Tamil</SelectItem>
                        <SelectItem value="bengali">Bengali</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description * (minimum 32 characters)</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of your content"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={isUploading}
                    className="min-h-24"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/32 minimum characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="releaseRights">Release Rights *</Label>
                  <Select
                    value={formData.releaseRights}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, releaseRights: value }))}
                    disabled={isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Release Rights *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="creator">This work is created by me and anyone is free to use it.</SelectItem>
                      <SelectItem value="family_or_friend">This work is created by my family/friends and I took permission to upload their work.</SelectItem>
                      <SelectItem value="downloaded">I downloaded this from the internet and/or I don't know if it is free to share.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Location (Optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getLocation}
                      disabled={isGettingLocation || isUploading}
                      className="flex items-center gap-2"
                    >
                      {isGettingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      Get Current Location
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        placeholder="e.g., 40.7128"
                        value={formData.latitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                        disabled={isUploading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        placeholder="e.g., -74.0060"
                        value={formData.longitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center animate-slide-up">
              <Button
                type="submit"
                variant="hero"
                size="xl"
                disabled={isUploading || (!selectedFile && !formData.textContent)}
                className="min-w-48"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-5 w-5 mr-2" />
                    Upload Contribution
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
