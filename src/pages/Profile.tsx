import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Trophy, 
  FileText,
  Image,
  Video,
  Music,
  TrendingUp,
  Edit
} from "lucide-react";
import { API_BASE_URL, clearToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  created_at: string;
}

interface UserStats {
  total: number;
  images: number;
  videos: number;
  audio: number;
  text: number;
}

export const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    images: 0,
    videos: 0,
    audio: 0,
    text: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [allUserContributions, setAllUserContributions] = useState<Contribution[]>([]); // New state for all contributions
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]); // New state for filtered contributions
  const [selectedMediaType, setSelectedMediaType] = useState<string | null>(null); // New state for selected media type
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserProfile();
  }, [navigate]);

  useEffect(() => {
    if (selectedMediaType === null) {
      setFilteredContributions(allUserContributions);
    } else {
      setFilteredContributions(allUserContributions.filter(c => c.media_type === selectedMediaType));
    }
  }, [selectedMediaType, allUserContributions]);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setIsLoading(true);
      
      // Fetch user profile
      const profileResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
        fetchUserContributions(profileData.id, token); // Fetch contributions after profile
      } else if (profileResponse.status === 401) {
        clearToken(); // Use clearToken from auth.ts
      } else {
        setError('Failed to fetch profile information');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('An error occurred while fetching your profile');
    } finally {
      setIsLoading(false);
    }
  };

  interface Contribution {
    id: string;
    title: string;
    description: string;
    media_type: 'audio' | 'video' | 'text' | 'image' | 'other';
    size: number;
    timestamp: string;
    language: string; // Added language
    latitude?: number; // Added latitude
    longitude?: number; // Added longitude
  }

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

  const fetchUserContributions = async (userId: string, token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/contributions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        let allContributions: Contribution[] = [];
        if (data.audio_contributions) allContributions = allContributions.concat(data.audio_contributions.map((c: Contribution) => ({ ...c, media_type: 'audio' })));
        if (data.video_contributions) allContributions = allContributions.concat(data.video_contributions.map((c: Contribution) => ({ ...c, media_type: 'video' })));
        if (data.text_contributions) allContributions = allContributions.concat(data.text_contributions.map((c: Contribution) => ({ ...c, media_type: 'text' })));
        if (data.image_contributions) allContributions = allContributions.concat(data.image_contributions.map((c: Contribution) => ({ ...c, media_type: 'image' })));

        setAllUserContributions(allContributions); // Store all contributions

        const newStats = {
          total: allContributions.length,
          images: allContributions.filter(c => c.media_type === 'image').length,
          videos: allContributions.filter(c => c.media_type === 'video').length,
          audio: allContributions.filter(c => c.media_type === 'audio').length,
          text: allContributions.filter(c => c.media_type === 'text').length,
        };
        setStats(newStats);

      } else {
        setError(data.message || 'Failed to fetch user contributions.');
        if (response.status === 401) {
          clearToken();
        }
      }
    } catch (error) {
      console.error('Fetch contributions error:', error);
      setError('An error occurred while fetching contributions. Please try again later.');
    }
  };

  const handleMediaTypeClick = (mediaType: string | null) => {
    setSelectedMediaType(mediaType);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name?: string, email?: string, phone?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    if (phone) {
      return phone.slice(-2);
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (profile?.name) return profile.name;
    if (profile?.email) return profile.email.split('@')[0];
    if (profile?.phone) return profile.phone;
    return 'User';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation isAuthenticated={true} />
        <main className="pt-20 pb-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="card-glass shadow-soft">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation isAuthenticated={true} />
      
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
              Your Profile
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your account and view your contributions
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 animate-scale-in">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-8">
            {/* Profile Card */}
            <Card className="card-glass shadow-soft animate-scale-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                      <AvatarFallback className="text-xl font-semibold bg-gradient-primary text-primary-foreground">
                        {getInitials(profile?.name, profile?.email, profile?.phone)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {getDisplayName()}
                      </h2>
                      <p className="text-muted-foreground">Food Corpus Contributor</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile?.email && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground">{profile.email}</p>
                      </div>
                    </div>
                  )}

                  {profile?.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-foreground">{profile.phone}</p>
                      </div>
                    </div>
                  )}


                  {profile?.created_at && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium text-foreground">{formatDate(profile.created_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card className="card-glass shadow-soft animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Contribution Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="text-center">
                    <Button variant="ghost" className="flex flex-col items-center justify-center w-full h-full p-0" onClick={() => handleMediaTypeClick(null)}>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-3">
                        <Trophy className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </Button>
                  </div>

                  <div className="text-center">
                    <Button variant="ghost" className="flex flex-col items-center justify-center w-full h-full p-0" onClick={() => handleMediaTypeClick('image')}>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3">
                        <Image className="h-8 w-8 text-blue-700" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">{stats.images}</h3>
                      <p className="text-sm text-muted-foreground">Images</p>
                    </Button>
                  </div>

                  <div className="text-center">
                    <Button variant="ghost" className="flex flex-col items-center justify-center w-full h-full p-0" onClick={() => handleMediaTypeClick('video')}>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-3">
                        <Video className="h-8 w-8 text-purple-700" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">{stats.videos}</h3>
                      <p className="text-sm text-muted-foreground">Videos</p>
                    </Button>
                  </div>

                  <div className="text-center">
                    <Button variant="ghost" className="flex flex-col items-center justify-center w-full h-full p-0" onClick={() => handleMediaTypeClick('audio')}>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                        <Music className="h-8 w-8 text-green-700" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">{stats.audio}</h3>
                      <p className="text-sm text-muted-foreground">Audio</p>
                    </Button>
                  </div>

                  <div className="text-center">
                    <Button variant="ghost" className="flex flex-col items-center justify-center w-full h-full p-0" onClick={() => handleMediaTypeClick('text')}>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-3">
                        <FileText className="h-8 w-8 text-orange-700" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">{stats.text}</h3>
                      <p className="text-sm text-muted-foreground">Text</p>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtered Contributions List */}
            <Card className="card-glass shadow-soft animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  {selectedMediaType ? `${selectedMediaType.charAt(0).toUpperCase() + selectedMediaType.slice(1)} Contributions` : 'All Contributions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredContributions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No {selectedMediaType || ''} contributions found.
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Start contributing to earn achievement badges!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContributions.map((contribution, index) => {
                      const Icon = getMediaIcon(contribution.media_type);
                      return (
                        <div
                          key={contribution.id}
                          className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className={`p-3 rounded-lg ${getMediaColor(contribution.media_type)}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">
                              {contribution.title}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {contribution.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {contribution.language}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(contribution.timestamp)}
                              </div>
                              {contribution.latitude && contribution.longitude && (
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

            {/* Achievement Badges */}
            <Card className="card-glass shadow-soft animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {stats.total >= 1 && (
                    <Badge variant="secondary" className="px-4 py-2 bg-gradient-primary text-primary-foreground">
                      First Contribution
                    </Badge>
                  )}
                  {stats.total >= 5 && (
                    <Badge variant="secondary" className="px-4 py-2">
                      Regular Contributor
                    </Badge>
                  )}
                  {stats.total >= 10 && (
                    <Badge variant="secondary" className="px-4 py-2">
                      Active Member
                    </Badge>
                  )}
                  {stats.images >= 5 && (
                    <Badge variant="secondary" className="px-4 py-2">
                      Image Specialist
                    </Badge>
                  )}
                  {stats.videos >= 3 && (
                    <Badge variant="secondary" className="px-4 py-2">
                      Video Creator
                    </Badge>
                  )}
                  {stats.total === 0 && (
                    <p className="text-muted-foreground">
                      Start contributing to earn achievement badges!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
