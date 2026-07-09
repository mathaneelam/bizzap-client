# Bizzap Design System

## Colors

| Token | Hex | Usage |
|---|---|---|
| Background | `#1a1a1a` | Page base |
| Surface 1 | `#222222` | Cards, navbar, sections |
| Surface 2 | `#2a2a2a` | Elevated cards, inputs |
| Surface 3 | `#333333` | Hover states, highlights |
| Accent | `#c96442` | CTAs, links, highlights, brand mark |
| Accent Hover | `#d4724e` | Button hover |
| Accent Glow | `rgba(201,100,66,0.12)` | Background glows, orbs |
| Primary Text | `#ececec` | Headlines, body |
| Muted Text | `#8e8ea0` | Captions, labels, secondary |
| Border | `rgba(255,255,255,0.08)` | Card borders, dividers |
| Ivory | `#faf9f5` | Button text on accent bg |

## Team Signature Colors

| Person | Color |
|---|---|
| Mathan Eelam (CEO) | `#c96442` |
| Sakthi Selvan (CTO) | `#3b82f6` |
| Kameswaran (CPO) | `#a855f7` |

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Headlines | `'DM Serif Display', Georgia, serif` | 400 | 42–72px |
| Body / UI | `system-ui, -apple-system, sans-serif` | 400–600 | 14–17px |
| Labels | System UI | 500 | 10–12px, uppercase, letter-spacing 3px |
| Section Label | System UI | 500 | 11px, uppercase, letter-spacing 3px, color accent |

## Spacing

| Token | Value |
|---|---|
| Section padding | 120px vertical |
| Container max-width | 1200px |
| Container side padding | 40px desktop, 20px mobile |
| Card padding | 32px desktop, 24px mobile |
| Card border-radius | 16px |
| Card gap | 24px |
| Button border-radius | 8px |
| Pill border-radius | 24–40px |

## Components

### Primary Button

```css
background: #c96442;
color: #faf9f5;
padding: 14px 32px;
border-radius: 8px;
font-size: 15px;
font-weight: 500;
/* hover */
background: #d4724e;
transform: translateY(-2px);
box-shadow: 0 12px 40px rgba(201,100,66,0.3);
```

### Ghost Button

```css
background: transparent;
color: #ececec;
border: 1px solid rgba(255,255,255,0.12);
border-radius: 8px;
/* hover */
border-color: #c96442;
color: #c96442;
```

### Card

```css
background: #222222;
border: 1px solid rgba(255,255,255,0.08);
border-radius: 16px;
transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
/* hover */
transform: translateY(-6px);
border-color: rgba(201,100,66,0.25);
box-shadow: 0 30px 80px rgba(0,0,0,0.35), 0 0 50px rgba(201,100,66,0.12);
```

### Gradient Border (hover effect)

```css
.card::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 17px;
  padding: 1px;
  background: linear-gradient(135deg, #c9644250, transparent 50%, transparent 80%, #c9644230);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.5s;
}
.card:hover::before { opacity: 1; }
```

### Nav Link

```css
color: #8e8ea0;
font-size: 14px;
/* hover */
color: #ececec;
/* underline */
::after {
  width: 0 → 100%;
  height: 1.5px;
  background: #c96442;
  transition: width 0.3s;
}
```

### Section Label

```css
font-size: 11px;
letter-spacing: 3px;
text-transform: uppercase;
color: #c96442;
font-weight: 500;
margin-bottom: 16px;
```

### Avatar Circle

```css
width: 90–100px;
height: 90–100px;
border-radius: 50%;
background: linear-gradient(135deg, {color}25, {color}08);
border: 2px solid {color}40;
/* letter inside */
font-family: 'DM Serif Display', Georgia, serif;
font-size: 32–36px;
color: {team-color};
```

## Glassmorphism Navbar

```css
/* default */
background: transparent;
/* on scroll (scrollY > 50) */
background: rgba(26,26,26,0.88);
backdrop-filter: blur(20px);
border-bottom: 1px solid rgba(255,255,255,0.08);
transition: all 0.4s;
height: 64px;
```

## Logo Wordmark

```
Font: DM Serif Display, 22px
Color: #ececec (all white, uniform — no colored "zz")
```

## Background Effects

### Film Grain

```css
position: fixed;
inset: 0;
z-index: 9999;
opacity: 0.03;
pointer-events: none;
/* SVG feTurbulence noise texture */
```

### Gradient Orb

```css
border-radius: 50%;
background: radial-gradient(circle, rgba(201,100,66,0.08–0.15), transparent 70%);
filter: blur(60–100px);
pointer-events: none;
```

### Rotating Ring

```css
border-radius: 50%;
border: 1px solid rgba(255,255,255,0.08);
animation: rotate 60s linear infinite;
/* dot at top */
width: 8px;
height: 8px;
border-radius: 50%;
background: #c96442;
opacity: 0.5;
```

### Dashed Inner Ring

```css
border: 1px dashed rgba(201,100,66,0.15);
```

## Animations

| Animation | CSS | Duration | Easing |
|---|---|---|---|
| Scroll Reveal | opacity 0→1, translateY(50px→0) | 0.9s | cubic-bezier(0.16,1,0.3,1) |
| Card Hover | translateY(-6px) | 0.5s | cubic-bezier(0.16,1,0.3,1) |
| Button Hover | translateY(-2px) | 0.3s | ease |
| Nav Underline | width 0→100% | 0.3s | ease |
| Float | translateY(0→-10px→0) | 5–6s | ease-in-out, infinite |
| Slow Rotate | rotate(0→360deg) | 60s | linear, infinite |
| Fade Up (video) | opacity 0→1, translateY(30px→0) | 0.6–1s | ease-out |
| Scale In (video) | opacity 0→1, scaleX(0→1) | 0.6s | ease-out |

## Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| ≤480px | Single column, hero 26px, section title 28px |
| ≤768px | Single column grids, hamburger nav, 20px padding |
| 769–1024px | Two-column grids |
| ≥1025px | Full layout, 4-col services, 3-col projects |

## File Format Rules

| Purpose | Format |
|---|---|
| Social media graphics | HTML |
| Interactive apps/websites | React JSX |
| Icons/logos/illustrations | SVG |
| Text-heavy content images | Markdown |

---

Built by Bizzap — bizzap.app
