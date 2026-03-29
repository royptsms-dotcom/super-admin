# 🎨 QUICK REFERENCE - WARNA & STYLING BARU

## Palette Warna DattaAble yang Digunakan

### Primary Colors
```
🔵 Primary Blue:      #04A9F5  (Main accent untuk buttons, links, active states)
🔵 Complementary:     #3EBFEA  (Secondary accent, info states)
```

### Status Colors  
```
🟢 Success (Teal):    #1DE9B6  (Status berhasil, green badges)
🔴 Danger (Red):      #F44236  (Error, delete, warning states)
🟡 Warning (Yellow):  #F4C22B  (Caution, alert messages)
```

### Backgrounds (Dark Mode - Default)
```
⬛ Primary BG:        #212224  (Halaman background)
⬛ Card BG:           #2b2c2f  (Card, panel background)
⬛ Input BG:          #393b3f  (Form input background)
━━━ Border:           #46484c  (Separator, border)
```

### Backgrounds (Light Mode)
```
⬜ Primary BG:        #f4f7fa  (Halaman background)
⬜ Card BG:           #ffffff  (Card, panel background)
⬜ Input BG:          #f3f5f7  (Form input background)
━━━ Border:           #f1f1f1  (Separator, border)
```

### Text Colors
```
⚪ Primary Text:      rgba(255, 255, 255, 0.8)  [Dark mode]
                      #1d2630                    [Light mode]
⚫ Muted Text:        #bfbfbf                    [Dark mode]
                      #888                       [Light mode]
```

---

## Font System

### Primary Font
```
Font:        Open Sans
Weights:     300 (Light), 400 (Normal), 500 (Medium), 600 (SemiBold), 700 (Bold)
Usage:       Semua teks utama pada dashboard
Import:      Google Fonts
```

### Monospace Font
```
Font:        Roboto Mono
Weights:     500 (Medium), 700 (Bold)
Usage:       Code, numbers, prices
```

### Alternatif Fonts (Available di Settings)
- Plus Jakarta Sans
- Inter
- Poppins
- Nunito

---

## Shadow & Effects

### Elevation Levels
```
Level 1 (Subtle):     0 1px 3px rgba(0,0,0,.1)         [Borders, subtle lift]
Level 2 (Standard):   0 2px 8px rgba(0,0,0,.2)         [Cards default]
Level 3 (Emphasis):   0 4px 12px rgba(4,169,245,.3)    [Buttons, logos]
Level 4 (Heavy):      0 20px 60px rgba(0,0,0,.3)       [Modals]
```

### Transitions
```
Smooth (Fast):        all .2s ease              [Hover, focus states]
Standard:             all .3s ease              [Layout changes]
Slow (Smooth):        all .3s cubic-bezier()    [Toast notifications]
```

---

## Component Reference

### Buttons

**Primary Button**
```
Background:   #04A9F5 (Primary Blue)
Color:        White
Padding:      10px 18px
Border:       None
Border Radius: 10px
Font Weight:  600
Shadow:       0 4px 12px rgba(4,169,245,.3)

Hover:        Opacity 0.92 + translateY(-1px) + stronger shadow
```

**Secondary Button (Ghost)**
```
Background:   Transparent
Border:       1px solid #46484c
Color:        Text color
Padding:      10px 18px

Hover:        Border #04A9F5 + soft blue background
```

**Small Button**
```
Padding:      7px 12px
Font Size:    11px
(Applies to .btn-sm)
```

### Form Elements

**Text Input / Select**
```
Background:   #393b3f (dark) / #f3f5f7 (light)
Border:       1px solid #46484c (dark) / #f1f1f1 (light)
Border Radius: 10px
Padding:      11px 14px
Font:         Open Sans, 13px

Focus State:  Border #04A9F5 + ring 0 0 0 3px rgba(4,169,245,.1)
```

**Form Label**
```
Font Size:    12px
Font Weight:  600
Color:        #bfbfbf
Text Transform: UPPERCASE
Letter Spacing: 0.05em
```

### Cards

**Standard Card**
```
Background:   #2b2c2f (dark) / #ffffff (light)
Border:       1px solid #46484c (dark) / #f1f1f1 (light)
Border Radius: 14px
Padding:      24px
Shadow:       0 1px 3px rgba(0,0,0,.1)

Hover:        Border color → rgba(4,169,245,.2)
```

### Tables

**Table Header**
```
Background:   rgba(0,0,0,.2) [dark theme overlay]
Font Size:    10px
Font Weight:  700
Text Transform: UPPERCASE
Letter Spacing: 0.08em
Padding:      12px 16px
Border Bottom: 1px solid border color
```

**Table Row Hover**
```
Background:   rgba(4,169,245,.04)  [Subtle blue tint]
```

### Navigation

**Sidebar Width**
```
Desktop:      264px (was 248px)
Collapsed:    80px (optional future)
```

**Nav Item (Inactive)**
```
Color:        #bfbfbf (muted)
Font Size:    13px
Font Weight:  500
Padding:      11px 12px
Border Radius: 10px

Hover:        Background rgba(4,169,245,.1) + text color change
```

**Nav Item (Active)**
```
Background:   rgba(4,169,245,.15)
Border Left:  3px solid #04A9F5
Color:        #04A9F5
```

---

## Spacing Reference

### Standard Gaps
```
Minimal:      4px
Tight:        8px
Standard:     12px
Comfortable:  16px
Generous:     20px
Extra:        24px
Large:        32px
```

### Border Radius
```
Minimal:      7px
Standard:     10px
Large:        12px
Extra:        14px
Full (Pills): 20px
Circle:       50%
```

### Padding
```
Compact:      8px 12px
Standard:     10px 18px
Large:        12px 20px
Extra:        14px 24px
```

---

## Icon Library (Available)

### Tabler Icons
**Installed**: https://cdn.jsdelivr.net/npm/@tabler/icons/

**Example Usage**:
```html
<i class="ti ti-chart-bar-2"></i>           <!-- Dashboard -->
<i class="ti ti-users"></i>                  <!-- Users -->
<i class="ti ti-building-hospital"></i>     <!-- Hospital -->
<i class="ti ti-settings"></i>              <!-- Settings -->
<i class="ti ti-logout"></i>                 <!-- Logout -->
<i class="ti ti-check"></i>                  <!-- Success -->
<i class="ti ti-download"></i>              <!-- Download -->
<i class="ti ti-trash"></i>                 <!-- Delete -->
<i class="ti ti-plus"></i>                   <!-- Add -->
<i class="ti ti-pencil"></i>                <!-- Edit -->
<i class="ti ti-dots-vertical"></i>         <!-- More options -->
```

Search all: https://tablericons.com/

---

## CSS Variables (Use in Custom CSS)

```css
:root {
  /* Colors */
  --accent: #04A9F5;              /* Primary */
  --accent2: #3EBFEA;             /* Secondary */
  --success: #1DE9B6;
  --danger: #F44236;
  --warning: #F4C22B;
  --info: #3EBFEA;
  
  /* Backgrounds */
  --bg: #212224;                  /* Main background */
  --bg2: #2b2c2f;                 /* Cards */
  --bg3: #393b3f;                 /* Inputs, hover states */
  
  /* Text */
  --text: rgba(255, 255, 255, 0.8);
  --muted: #bfbfbf;
  
  /* Borders */
  --border: #46484c;
  
  /* Typography */
  --font: 'Open Sans', sans-serif;
  --mono: 'Roboto Mono', monospace;
  
  /* Effects */
  --shadow: 0 2px 8px rgba(0,0,0,0.2);
}

/* Light mode */
[data-theme="light"] {
  --bg: #f4f7fa;
  --bg2: #ffffff;
  --bg3: #f3f5f7;
  --text: #1d2630;
  --muted: #888;
  --border: #f1f1f1;
  --shadow: 0 2px 8px rgba(0,0,0,0.07);
}
```

---

## Tips & Tricks

### 1. Mengubah Accent Color Programmatic
```javascript
setAccent('#04A9F5', '#3EBFEA');  // [primary, secondary]
```

### 2. Mengubah Font Programmatic
```javascript
setFont('Open Sans');  // Font name dari list tersedia
```

### 3. Mengubah Tema
```javascript
setTheme('dark');   // atau 'light'
toggleTheme();      // Toggle antara dark/light
```

### 4. Menambah Custom Color
Edit CSS variables di `<style>` section (line ~11)

### 5. Menambah Icon ke HTML
```html
<span class="icon">
  <i class="ti ti-chart-bar-2"></i>  <!-- Tabler Icon -->
</span>
```

---

## Troubleshooting

### Font tidak berubah?
- ✅ Clear browser cache (Ctrl+Shift+Delete)
- ✅ Check localStorage punya data `admin_prefs`
- ✅ Verify Google Fonts loading (Network tab)

### Warna tidak bekerja?
- ✅ Check CSS variables di :root
- ✅ Verify tidak ada inline style yang override
- ✅ Check dark/light mode toggle

### Icon tidak muncul?
- ✅ Verify CDN URL aktif (https://cdn.jsdelivr.net/)
- ✅ Check class name `ti ti-xxx` benar
- ✅ Cek internet connection untuk font load

---

**Last Updated**: March 28, 2026
**Status**: Production Ready ✅
