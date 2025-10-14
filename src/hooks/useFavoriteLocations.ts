import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FavoriteLocation {
  id: string;
  user_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  created_at: string | null;
}

export const useFavoriteLocations = () => {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorite locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch favorite locations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (locationName: string, latitude: number, longitude: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to save favorite locations',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('favorite_locations').insert({
        user_id: user.id,
        location_name: locationName,
        latitude,
        longitude,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Saved',
            description: 'This location is already in your favorites',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Location Saved',
        description: `${locationName} added to favorites`,
      });

      fetchFavorites();
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to save favorite location',
        variant: 'destructive',
      });
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('favorite_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Location Removed',
        description: 'Removed from favorites',
      });

      fetchFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove favorite location',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return { favorites, loading, addFavorite, removeFavorite, refetch: fetchFavorites };
};
