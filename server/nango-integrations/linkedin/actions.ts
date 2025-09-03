import type { NangoAction, CreatePostInput, Post } from './models';

export default async function createpost(nango: NangoAction): Promise<Post> {
  const input = nango.input as CreatePostInput;
  
  try {
    // LinkedIn API requires specific headers
    const response = await nango.post({
      endpoint: '/v2/ugcPosts',
      data: input,
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json'
      }
    });
    
    await nango.log(`Successfully executed create-post`);
    
    return {
      success: true,
      data: response.data,
      id: response.data?.id
    };
    
  } catch (error) {
    await nango.log(`Action create-post failed: ${error.message}`, 'error');
    throw new Error(`LinkedIn create-post failed: ${error.message}`);
  }
}

import type { NangoAction, GetProfileInput, Profile } from './models';

export default async function getprofile(nango: NangoAction): Promise<Profile> {
  const input = nango.input as GetProfileInput;
  
  try {
    // LinkedIn API requires specific headers
    const response = await nango.get({
      endpoint: '/v2/userinfo',
      data: input,
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json'
      }
    });
    
    await nango.log(`Successfully executed get-profile`);
    
    return {
      success: true,
      data: response.data,
      id: response.data?.id
    };
    
  } catch (error) {
    await nango.log(`Action get-profile failed: ${error.message}`, 'error');
    throw new Error(`LinkedIn get-profile failed: ${error.message}`);
  }
}