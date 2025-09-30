# Marketplace Solutions Component

A visual marketplace component styled like the Industry Solutions interface, displaying installed marketplace items (agent skills, system prompts, slash commands) as circular icons with status indicators.

## Features

- 🎨 **Circular Icon Design**: Same visual style as Industry Solutions connectors
- 📦 **Item Management**: View, enable/disable, and uninstall marketplace items
- 💬 **Marketplace Chat**: Browse and install new items from the marketplace
- 📊 **Dashboard View**: Overview of all installed items with statistics
- 🔄 **Real-time Status**: Active/inactive indicators for each item
- 🎯 **Category Filtering**: Filter by agent skills, prompts, or commands

## Components

### 1. MarketplaceSolutions (Main Component)
The primary component that displays circular icons for installed marketplace items.

### 2. MarketplaceChat (Modal)
A side panel modal for browsing the marketplace and managing installed items.

### 3. MarketplaceDashboard (Dashboard View)
A comprehensive dashboard showing statistics and detailed item information.

## Usage

### Basic Usage

```jsx
import MarketplaceSolutions from "@/components/MarketplaceSolutions";

function MyComponent() {
  return (
    <MarketplaceSolutions
      className="my-custom-class"
      onItemClick={(item) => console.log("Item clicked:", item)}
      maxVisible={8}
      compact={false}
    />
  );
}
```

### In Workspace Chat Header

Add to `/frontend/src/components/WorkspaceChat/ChatContainer/index.jsx`:

```jsx
import MarketplaceSolutions from "@/components/MarketplaceSolutions";

// Inside your component's return statement:
<div className="flex items-center gap-4">
  <MarketplaceSolutions
    compact={true}
    maxVisible={6}
  />
  {/* Other header content */}
</div>
```

### In Settings Page

Add to any settings page alongside Industry Solutions:

```jsx
import IndustrySolutions from "@/components/IndustrySolutions";
import MarketplaceSolutions from "@/components/MarketplaceSolutions";

<div className="flex flex-col gap-4">
  <IndustrySolutions />
  <MarketplaceSolutions />
</div>
```

### Combined View

Show both connectors and marketplace items together:

```jsx
<div className="flex items-center gap-6">
  <IndustrySolutions
    compact={true}
    maxVisible={6}
  />
  <div className="w-px h-8 bg-gray-300" />
  <MarketplaceSolutions
    compact={true}
    maxVisible={6}
  />
</div>
```

## Props

### MarketplaceSolutions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | string | `""` | Additional CSS classes |
| `onItemClick` | function | `undefined` | Callback when an item is clicked |
| `onBrowseMarketplace` | function | `undefined` | Custom handler for browse button |
| `maxVisible` | number | `8` | Maximum number of items to show initially |
| `showCategories` | boolean | `true` | Show category grouping |
| `compact` | boolean | `false` | Enable compact mode (smaller icons) |

### MarketplaceChat

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls modal visibility |
| `onClose` | function | Yes | Close handler |
| `items` | array | No | Current installed items |
| `onItemAction` | function | No | Callback for item actions |
| `onRefresh` | function | No | Refresh items callback |

### MarketplaceDashboard

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `items` | array | Yes | Installed marketplace items |
| `onRefresh` | function | No | Refresh items callback |
| `onItemAction` | function | No | Callback for item actions |

## Item Data Structure

Items should have the following structure:

```javascript
{
  id: "unique-id",
  name: "Item Name",
  itemType: "agent-skill" | "system-prompt" | "slash-command" | "plugin",
  active: true | false,
  hubId: "hub-item-id",
  description: "Item description",
  // ... other fields
}
```

## Styling

The component uses:
- Tailwind CSS for styling
- Phosphor Icons for icon components
- Same design language as Industry Solutions
- Dark mode support
- Responsive design

## API Integration

The component integrates with the existing CommunityHub model:

```javascript
import CommunityHub from "@/models/communityHub";

// Get installed items
const items = await CommunityHub.getInstalledItems();

// Fetch explore items
const { result } = await CommunityHub.fetchExploreItems();

// Install an item
await CommunityHub.importBundleItem(importId);

// Toggle item status
await CommunityHub.toggleItem(itemId, active);

// Uninstall item
await CommunityHub.uninstallItem(itemId);
```

## Examples

### Example 1: Header with Both Solutions

```jsx
<header className="flex items-center justify-between p-4">
  <div className="flex items-center gap-6">
    <h1>My Workspace</h1>

    <div className="flex items-center gap-4">
      <IndustrySolutions compact={true} maxVisible={4} />
      <div className="w-px h-6 bg-gray-300" />
      <MarketplaceSolutions compact={true} maxVisible={4} />
    </div>
  </div>
</header>
```

### Example 2: Sidebar Integration

```jsx
<aside className="w-64 p-4 space-y-6">
  <div>
    <h3 className="text-sm font-semibold mb-2">Connected Platforms</h3>
    <IndustrySolutions
      compact={false}
      showCategories={false}
    />
  </div>

  <div>
    <h3 className="text-sm font-semibold mb-2">Installed Tools</h3>
    <MarketplaceSolutions
      compact={false}
      showCategories={false}
    />
  </div>
</aside>
```

### Example 3: Dashboard Page

```jsx
<div className="container mx-auto p-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Business Platforms</h2>
      <IndustrySolutions compact={false} maxVisible={12} />
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Marketplace Tools</h2>
      <MarketplaceSolutions compact={false} maxVisible={12} />
    </div>
  </div>
</div>
```

## Testing

To test the component:

1. Start the development server:
   ```bash
   yarn dev:frontend
   ```

2. Import and use the component in any page

3. Check that:
   - Circular icons display correctly
   - Status indicators show (active/inactive)
   - Modal opens when clicking chat button
   - Items can be browsed and installed
   - Dashboard shows statistics

## Troubleshooting

### Icons not displaying
- Ensure `@phosphor-icons/react` is installed
- Check import statements

### API errors
- Verify CommunityHub model is properly configured
- Check network requests in browser DevTools
- Ensure backend endpoints are running

### Styling issues
- Clear Tailwind cache: `rm -rf .cache`
- Rebuild: `yarn build`
- Check for conflicting CSS classes

## Future Enhancements

- [ ] Drag and drop to reorder items
- [ ] Item grouping by category
- [ ] Quick actions on hover
- [ ] Item usage statistics
- [ ] Version updates notifications
- [ ] Bulk enable/disable operations
- [ ] Export/import item configurations
