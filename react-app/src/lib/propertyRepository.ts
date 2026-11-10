import { supabase } from './supabase';

export type MarketplaceProperty = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  locality: string;
  purpose: 'sale' | 'rent' | 'lease';
  property_type: 'apartment' | 'house' | 'plot' | 'commercial' | 'pg';
  price: number;
  area_sqft: number | null;
  contact_phone: string | null;
  publish_contact: boolean;
  status: 'approved';
  created_at: string;
};

export type PropertyPhoto = { property_id: string; storage_path: string; sort_order: number };

export async function listApprovedProperties(): Promise<(MarketplaceProperty & { photoUrls: string[] })[]> {
  const { data, error } = await supabase.from('public_properties')
    .select('id,title,description,city,locality,purpose,property_type,price,area_sqft,contact_phone,publish_contact,status,created_at')
    .eq('status', 'approved').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  const listings = (data ?? []) as MarketplaceProperty[];
  if (!listings.length) return [];
  const { data: photos, error: photoError } = await supabase.from('property_photos')
    .select('property_id,storage_path,sort_order').in('property_id', listings.map(p => p.id))
    .order('sort_order', { ascending: true });
  if (photoError) throw photoError;
  return listings.map(property => ({
    ...property,
    photoUrls: ((photos ?? []) as PropertyPhoto[])
      .filter(photo => photo.property_id === property.id)
      .map(photo => supabase.storage.from('property-photos').getPublicUrl(photo.storage_path).data.publicUrl)
  }));
}

export async function requestEmailLogin(email: string, redirectUrl: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectUrl } });
  if (error) throw error;
}

export async function createProperty(input: Omit<MarketplaceProperty, 'id' | 'status' | 'created_at'>) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Please sign in to post a property.');
  const { data, error } = await supabase.from('properties')
    .insert({ ...input, user_id: user.id, status: 'pending' }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export async function uploadPropertyPhotos(propertyId: string, files: File[]) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sign in before uploading photos.');
  if (files.length > 6) throw new Error('Maximum six images per property.');
  for (const [index, file] of files.entries()) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
      throw new Error('Images must be JPG, PNG or WebP and under 5 MB each.');
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const storage_path = `${user.id}/${propertyId}/${crypto.randomUUID()}.${ext}`;
    const uploaded = await supabase.storage.from('property-photos').upload(storage_path, file, { upsert: false, contentType: file.type });
    if (uploaded.error) throw uploaded.error;
    const linked = await supabase.from('property_photos').insert({ property_id: propertyId, storage_path, sort_order: index });
    if (linked.error) throw linked.error;
  }
}

export async function listAdminProperties() {
  const { data, error } = await supabase.rpc('admin_list_properties');
  if (error) throw error;
  return data;
}

export async function reviewProperty(id: string, status: 'approved' | 'rejected' | 'pending') {
  const { error } = await supabase.rpc('admin_review_property', { target_id: id, new_status: status });
  if (error) throw error;
}
