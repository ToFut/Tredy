import type { NangoAction, CreateProductInput, Product } from './models';

export default async function createproduct(nango: NangoAction): Promise<Product> {
  const input = nango.input as CreateProductInput;
  
  try {
    // LinkedIn API requires specific headers
    const response = await nango.post({
      endpoint: '/products.json',
      data: input,
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json'
      }
    });
    
    await nango.log(`Successfully executed create-product`);
    
    return {
      success: true,
      data: response.data,
      id: response.data?.id
    };
    
  } catch (error) {
    await nango.log(`Action create-product failed: ${error.message}`, 'error');
    throw new Error(`LinkedIn create-product failed: ${error.message}`);
  }
}

import type { NangoAction, GetProductInput, Product } from './models';

export default async function getproduct(nango: NangoAction): Promise<Product> {
  const input = nango.input as GetProductInput;
  
  try {
    // LinkedIn API requires specific headers
    const response = await nango.get({
      endpoint: '/products/{id}.json',
      data: input,
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json'
      }
    });
    
    await nango.log(`Successfully executed get-product`);
    
    return {
      success: true,
      data: response.data,
      id: response.data?.id
    };
    
  } catch (error) {
    await nango.log(`Action get-product failed: ${error.message}`, 'error');
    throw new Error(`LinkedIn get-product failed: ${error.message}`);
  }
}

import type { NangoAction, UpdateInventoryInput, InventoryLevel } from './models';

export default async function updateinventory(nango: NangoAction): Promise<InventoryLevel> {
  const input = nango.input as UpdateInventoryInput;
  
  try {
    // LinkedIn API requires specific headers
    const response = await nango.put({
      endpoint: '/inventory_levels/set.json',
      data: input,
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json'
      }
    });
    
    await nango.log(`Successfully executed update-inventory`);
    
    return {
      success: true,
      data: response.data,
      id: response.data?.id
    };
    
  } catch (error) {
    await nango.log(`Action update-inventory failed: ${error.message}`, 'error');
    throw new Error(`LinkedIn update-inventory failed: ${error.message}`);
  }
}

import type { NangoAction, GetOrdersInput, OrderList } from './models';

export default async function getorders(nango: NangoAction): Promise<OrderList> {
  const input = nango.input as GetOrdersInput;
  
  try {
    // LinkedIn API requires specific headers
    const response = await nango.get({
      endpoint: '/orders.json',
      data: input,
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json'
      }
    });
    
    await nango.log(`Successfully executed get-orders`);
    
    return {
      success: true,
      data: response.data,
      id: response.data?.id
    };
    
  } catch (error) {
    await nango.log(`Action get-orders failed: ${error.message}`, 'error');
    throw new Error(`LinkedIn get-orders failed: ${error.message}`);
  }
}