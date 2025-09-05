# Minimal Token/Complexity Header Design

## Stock Market Style Token Indicator

### Design Concept
- Location: Chat header, minimal and compact
- Style: Stock market ticker-like display
- Position: Near header, non-intrusive

### Key Features
1. **Minimal Display**
   - Small, compact token counter
   - Clean numerical display
   - Subtle color indicators (green/red for efficiency)

2. **Visual Elements**
   - Tiny up/down arrows (↑/↓) showing complexity trend
   - Compact number format (e.g., "12.4k" instead of "12,400")
   - Light/subtle background differentiation

3. **Layout**
   ```
   [↑12.4k] // Example of efficient token usage
   [↓28.6k] // Example of higher token usage
   ```

### Interaction
- Hover to show detailed breakdown
- Click to expand full complexity metrics
- Auto-updates as conversation progresses

### Color Scheme
- Default: Neutral, matches header theme
- Efficient (Green): Below average token usage
- Warning (Red): Approaching token limits
- All colors should be subtle and non-distracting

### Animation
- Subtle number transitions
- Smooth arrow changes
- Minimal movement to avoid distraction

