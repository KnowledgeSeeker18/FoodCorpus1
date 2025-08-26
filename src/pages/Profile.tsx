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

const API_BASE_URL = 'https://api.corpus.swecha.org/api/v1';

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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserProfile();
  }, [navigate]);

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

        // Fetch user records for stats
        const recordsResponse = await fetch(`${API_BASE_URL}/records/my`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          const records = recordsData.records || [];
          
          const newStats = {
            total: records.length,
            images: records.filter((r: any) => r.media_type === 'image').length,
            videos: records.filter((r: any) => r.media_type === 'video').length,
            audio: records.filter((r: any) => r.media_type === 'audio').length,
            text: records.filter((r: any) => r.media_type === 'text').length,
          };
          setStats(newStats);
        }
      } else if (profileResponse.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
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

                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-medium text-foreground font-mono text-sm">{profile?.id}</p>
                    </div>
                  </div>

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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-3">
                      <Trophy className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3">
                      <Image className="h-8 w-8 text-blue-700" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{stats.images}</h3>
                    <p className="text-sm text-muted-foreground">Images</p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-3">
                      <Video className="h-8 w-8 text-purple-700" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{stats.videos}</h3>
                    <p className="text-sm text-muted-foreground">Videos</p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                      <Music className="h-8 w-8 text-green-700" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{stats.audio}</h3>
                    <p className="text-sm text-muted-foreground">Audio</p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-3">
                      <FileText className="h-8 w-8 text-orange-700" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{stats.text}</h3>
                    <p className="text-sm text-muted-foreground">Text</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Badges */}
            <Card className="card-glass shadow-soft animate-scale-in" style={{ animationDelay: '0.2s' }}>
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