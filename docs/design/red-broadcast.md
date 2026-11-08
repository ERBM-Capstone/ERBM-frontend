# Red Broadcast in ERBM

The interface applies the supplied Red Broadcast direction to project management, worklists, and account screens. Existing business rules, API transport, and session ownership remain unchanged.

## Visual system

| Role | Value |
| --- | --- |
| Brand accent and error indicator | `#FF0000` |
| Accent hover | `#CC0000` |
| Links and keyboard focus | `#065FD4` |
| Background | `#FFFFFF` |
| Subtle surface | `#F2F2F2` |
| Primary text and primary buttons | `#0F0F0F` |
| Secondary text and icons | `#606060` |
| Dividers | `#E5E5E5` |
| Success indicator | `#2BA640` |
| Warning indicator | `#FB8C00` |

Roboto is the main typeface; Noto Sans Thai supplies Thai glyphs, and Roboto Mono is available for code. Fonts are sourced through `next/font/google` and served locally by Next.js. Google Fonts access is required for a fresh build. Titles use 24/32px at weight 700; section headings use 20/28px at weight 500; controls and body copy use 14/20px; metadata uses 12px. Inputs use 16px on small screens to avoid mobile browser focus zoom.

Use a 4/8px spacing scale and a fluid content area capped at 2200px. The supplied [PC Worklist frame in Figma](https://www.figma.com/design/uuG2vKXEFZdmO9NsK6Rivn/Capstone-AI-design?node-id=3001-10931) refines the application shell: the header is 72px high, desktop navigation is 216px wide or collapses to a 72px icon rail, and the desktop content has 40px horizontal gutters. Mobile navigation uses a native modal dialog with keyboard dismissal and focus containment.

Pages and data tables sit directly on the white background. Use dividers for structure and reserve elevation for the account dropdown. Buttons and filter chips use pill shapes; navigation items and menus use 8px corners; the account branding panel uses 12px corners. Project titles are clamped to two lines with their full text available in the title attribute.

Red is a restrained brand and error accent. Primary actions use dark fills as specified in the component brief. Error text uses a darker red for readable contrast; success and warning text also use darker semantic shades. Status labels always accompany indicators. No video thumbnails, previews, player controls, or subscription features are introduced into ERBM.

## Shared implementation

- Tokens, field styles, buttons, notices, focus states, and reduced-motion handling: `src/app/globals.css`.
- Use the keyboard-accessible `DropdownSelect` in `src/components/ui/DropdownSelect.tsx` for filters, sorting, and form choices instead of native `<select>` controls.
- Fonts: `src/app/layout.tsx`.
- Branding and navigation: `src/components/layout/`.
- Application and account screens: `src/app/(dashboard)/` and `src/app/(auth)/`.

The Project page's search, status chips, PM/PC filters, active-advance filter, retry, and pagination use the existing project and advance list endpoints. The project detail page keeps project information collapsible and groups live advances into pending requests and history. Assigned PCs can create advance drafts from their active projects, and authorized users can edit project fields supported by the current API. Department is not part of the current project API. The create-project form loads active employees and derives PM/PC options from existing project assignments; department choices remain sample data because the project API does not support that field. People without an existing PM/PC project assignment are not available in these options until the backend exposes a role-aware assignee list.

The Worklist follows the Figma reference as a clearly labeled design preview. Its seven example requests live in `src/app/(dashboard)/worklist/example-data.ts`; search, status/project filtering, sorting, empty states, and read-only detail dialogs operate on those examples. They are not authenticated account data or a new advance API integration. Opening an example never changes its status. The create-request button explains the preview boundary and links to the existing Project page; it does not submit or change a request. All seven documented status labels, including Closing, are retained for visual review without establishing new API enum mappings or workflow permissions.

The shell displays full names and role labels derived from `/me`'s `role_code`, and places a notification popover beside the profile control. Notifications explicitly show their unavailable state rather than claiming the account has no notifications. The company name uses a text wordmark; the original Sense Infotech vector asset has not been exported from Figma.
