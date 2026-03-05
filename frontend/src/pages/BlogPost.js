import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ChevronLeft, Calendar, Eye, User } from 'lucide-react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/blog/${slug}`);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/blog')} className="mb-6 gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Blog
        </Button>

        <article>
          {post.category && (
            <Badge className="mb-4">{post.category}</Badge>
          )}

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
            {post.author_name && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(parseISO(post.created_at), 'dd-MM-yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.view_count} views
            </span>
          </div>

          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full rounded-2xl mb-8 shadow-lg"
            />
          )}

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags?.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
