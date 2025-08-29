import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Music, 
  TrendingUp, 
  Users, 
  Database,
  Plus,
  Calendar,
  MapPin
} from "lucide-react";
import { API_BASE_URL, clearToken } from "@/lib/auth";

interface Record {
  id: string;
  title: string;
  description: string;
  media_type: string;
  created_at: string;
  language: string;
  latitude?: number;
  longitude?: number;
}

export const Home = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRecords();
  }, [navigate]);

  const fetchRecords = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setIsLoading(true);

      // First, get user ID from /auth/me
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
          localStorage.setItem('userId', userId); // Store for future use
        } else {
          throw new Error(meData.message || 'Failed to get user ID for fetching contributions.');
        }
      }

      // Then, fetch user contributions using the user ID
      const response = await fetch(`${API_BASE_URL}/users/${userId}/contributions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let allContributions: Record[] = [];
        if (data.audio_contributions) allContributions = allContributions.concat(data.audio_contributions.map((c: Record) => ({ ...c, media_type: 'audio' })));
        if (data.video_contributions) allContributions = allContributions.concat(data.video_contributions.map((c: Record) => ({ ...c, media_type: 'video' })));
        if (data.text_contributions) allContributions = allContributions.concat(data.text_contributions.map((c: Record) => ({ ...c, media_type: 'text' })));
        if (data.image_contributions) allContributions = allContributions.concat(data.image_contributions.map((c: Record) => ({ ...c, media_type: 'image' })));
        setRecords(allContributions || []);
      } else if (response.status === 401) {
        clearToken(); // Use clearToken from auth.ts
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch records:', response.status, errorData);
        setError(errorData.message || 'Failed to fetch records');
      }
    } catch (error: unknown) {
      console.error('Error fetching records:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching your records.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'text': return FileText;
      default: return FileText;
    }
  };

  const getMediaColor = (mediaType: string) => {
    switch (mediaType) {
      case 'image': return 'bg-blue-100 text-blue-700';
      case 'video': return 'bg-purple-100 text-purple-700';
      case 'audio': return 'bg-green-100 text-green-700';
      case 'text': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    total: records.length,
    images: records.filter(r => r.media_type === 'image').length,
    videos: records.filter(r => r.media_type === 'video').length,
    audio: records.filter(r => r.media_type === 'audio').length,
    text: records.filter(r => r.media_type === 'text').length,
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation isAuthenticated={true} />
      
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Welcome to Food Corpus
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Contribute to the world's largest collection of food-related content. 
              Share recipes, cooking videos, food images, and culinary knowledge.
            </p>
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate('/upload')}
              className="animate-bounce-gentle"
            >
              <Plus className="h-5 w-5 mr-2" />
              Start Contributing
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="card-glass hover:shadow-soft transition-all duration-300 animate-scale-in">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary mb-4">
                  <Database className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
                <p className="text-sm text-muted-foreground">Total Contributions</p>
              </CardContent>
            </Card>

            <Card className="card-glass hover:shadow-soft transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                  <Image className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{stats.images}</h3>
                <p className="text-sm text-muted-foreground">Images</p>
              </CardContent>
            </Card>

            <Card className="card-glass hover:shadow-soft transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
                  <Video className="h-6 w-6 text-purple-700" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{stats.videos}</h3>
                <p className="text-sm text-muted-foreground">Videos</p>
              </CardContent>
            </Card>

            <Card className="card-glass hover:shadow-soft transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                  <Music className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{stats.audio}</h3>
                <p className="text-sm text-muted-foreground">Audio Files</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Contributions */}
          <Card className="card-glass shadow-soft animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Your Recent Contributions
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => navigate('/upload')}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Add New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg animate-pulse">
                      <div className="w-12 h-12 bg-muted rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No contributions yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Start contributing to the food corpus by uploading your first content.
                  </p>
                  <Button
                    variant="default"
                    onClick={() => navigate('/upload')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Your First Content
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {records.slice(0, 5).map((record, index) => {
                    const Icon = getMediaIcon(record.media_type);
                    return (
                      <div
                        key={record.id}
                        className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className={`p-3 rounded-lg ${getMediaColor(record.media_type)}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {record.title}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {record.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {record.language}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(record.created_at)}
                            </div>
                            {record.latitude && record.longitude && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                Location
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
