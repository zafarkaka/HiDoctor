import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Footer } from '../components/Layout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Calendar, Eye, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function BlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetchPosts();
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/campaigns?placement=blog`);
      setAds(response.data.ads || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const handleAdClick = async (ad) => {
    try {
      await axios.post(`${API_URL}/api/campaigns/${ad.id}/click`);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    if (ad.redirect_url) window.open(ad.redirect_url, '_blank');
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/blog`);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Health & Wellness Blog</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Expert insights, health tips, and the latest in medical research to help you live your healthiest life.
          </p>
        </div>

        {ads.length > 0 && (
          <div className="mb-12 grid md:grid-cols-2 gap-6">
            {ads.map((ad, idx) => (
              <Card key={idx} className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-primary/20 bg-primary/5" onClick={() => handleAdClick(ad)}>
                <div className="flex items-center gap-4">
                  <img src={ad.image_url} alt={ad.title} className="w-1/3 h-32 object-cover" />
                  <div className="p-4 flex-1">
                    <Badge variant="secondary" className="mb-2">Sponsored</Badge>
                    <h3 className="font-semibold text-lg line-clamp-1">{ad.title}</h3>
                    <p className="text-primary text-sm flex items-center mt-2 group-hover:underline">
                      Learn More <ArrowRight className="w-4 h-4 ml-1" />
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="border-border/50">
                <Skeleton className="h-48 rounded-t-lg" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/blog/${post.slug}`)}
                data-testid={`blog-post-${post.slug}`}
              >
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <span className="text-4xl font-bold text-primary/30">{post.title?.charAt(0)}</span>
                    </div>
                  )}
                  {post.category && (
                    <Badge className="absolute top-3 left-3">{post.category}</Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h2 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(post.created_at), 'dd-MM-yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.view_count}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">Check back soon for health tips and articles.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
