/**
 * The narrated walkthrough videos and their narration, one entry per area.
 *
 * Files live in `public/videos/`. The videos are produced outside this repo (one folder per
 * video under `~/.codex/outputs/`, e.g. `elisen-regulations-video-2026-11-02`); the captions
 * come from the same word timings. Each transcript is the spoken script, in the video's
 * chapter order, so the page says exactly what the narrator says.
 */
export interface Walkthrough {
  /** The page's `<h1>`. */
  title: string
  /** One line under the title, ending with the running time. */
  description: string
  /** The sidebar child this page sits under, and the list it goes back to. */
  activeChild: string
  back: { to: string; label: string }
  video: string
  captions: string
  poster: string
  chapters: { title: string; text: string }[]
}

export const CERT_BASIS_WALKTHROUGH: Walkthrough = {
  title: 'Certification Basis Walkthrough',
  description: 'A narrated tour of finding, creating, reviewing and sharing a certification basis. 2 min 40 s.',
  activeChild: 'Certification Basis',
  back: { to: '/gcp/cert-bases', label: 'Go back to all certification bases' },
  video: '/videos/certification-basis-walkthrough.mp4',
  captions: '/videos/certification-basis-walkthrough.en.vtt',
  poster: '/videos/certification-basis-walkthrough.jpg',
  chapters: [
    {
      title: 'Previous TPMS: four separate maintenance areas',
      text: 'This walkthrough compares the previous certification basis workflow with the updated application. In the previous TPMS, related tasks were spread across four maintenance areas. Master Cert Basis held the code and description. Cert Basis attached regulations to that Master, using Add or Bulk Add. Spreadsheet Import provided another way to add regulations, while Master Cert Basis Associate linked the Basis to TCCA projects. Maintaining the record meant moving between these areas and opening the relevant Update screens. The Cert Basis listing also displayed one row for each regulation link, repeating the same Master code and description.',
    },
    {
      title: 'Certification Basis: one row for each Basis',
      text: 'In the updated application, the area is called Certification Basis. Each Basis appears once in the listing, alongside its description, regulation count and project usage count. Search helps us find the record, and clicking its code opens the details. To create a Basis, select Add. Creation follows two steps.',
    },
    {
      title: 'Create, step 1: Basis details and source',
      text: 'First, enter the Basis code and description, the same identity previously created in Master Cert Basis. This step adds dedicated optional reference fields for the TCDS number, source link and Basis statement as written in the document. An optional source PDF upload is available alongside these references.',
    },
    {
      title: 'Create, step 2: choose and review regulations',
      text: 'Select Continue to choose the regulations. The searchable list identifies each existing rule by its section, amendment and title. Select one rule, or tick several, then use Add selected to include them together. The selected regulations appear in the table below. Review the list, remove any unwanted entries, and check the Basis details before selecting Create Basis.',
    },
    {
      title: 'Saved Basis: reopen, read and edit',
      text: 'After creation, return to the listing and reopen the same Basis. Regulations shows the selected rules, and opening a rule displays its saved requirement text in a readable side panel. To adjust the selection later, choose Edit and use the same control to add further regulations.',
    },
    {
      title: 'Shared use: project usage and Import',
      text: 'For an existing shared Basis, Used By shows the TCCA projects that use it, with links to the relevant GCP workflow. Project association remains managed within GCP Projects. The spreadsheet Import option is also retained for adding a prepared regulation list to an existing Basis. The result is a clearer route through the work: find the Basis, review its references, select the appropriate regulations, and see where the shared record is used.',
    },
  ],
}

export const REGULATIONS_WALKTHROUGH: Walkthrough = {
  title: 'Regulatory Library Walkthrough',
  description: 'A narrated tour of the rule list, a regulation, Certification Topics and Regulation Groups. 2 min 52 s.',
  activeChild: 'Regulatory Library',
  back: { to: '/gcp/regulations', label: 'Go back to the Regulatory Library' },
  video: '/videos/regulatory-library-walkthrough.mp4',
  captions: '/videos/regulatory-library-walkthrough.en.vtt',
  poster: '/videos/regulatory-library-walkthrough.jpg',
  chapters: [
    {
      title: 'Previous TPMS: five separate maintenance screens',
      text: 'This walkthrough shows how regulations are maintained in the updated application. In the previous TPMS, regulation data was kept on five separate maintenance screens. Subpart held the topics of the book, each with a code and a description. Subsection held the sections inside each topic, and named the Subpart it belonged to. Regulation was one long list. For every rule we typed the section, amendment and title, the Subpart and Subsection codes, the FAA source link, the sort order, the requirement text, the means of compliance and the section root. Regulation Group and Regulation Group Section were two more screens, linking a kind of modification to the rules it affects.',
    },
    {
      title: 'Regulatory Library: one list of every rule',
      text: 'In the updated application, this area is called the Regulatory Library. Its Regulations tab is the same complete list, made easier to read. Each row shows the section, amendment, title, subpart, subsection, section root, source link, and whether the rule is active. Search finds a rule by its section, amendment or title, and Filters narrow the list further.',
    },
    {
      title: 'A regulation: read, add and edit',
      text: 'Opening a rule displays its saved requirement text and means of compliance in a readable side panel, together with the other amendments of the same section, and its FAA source is one click away. Previous and Next move through the list. Add Regulation asks for the same details as before, grouped into Rule, Text and Placement, with the subpart and subsection chosen at the top. Edit uses the same form. A regulation that a basis or plan already uses cannot be deleted; it can be made inactive instead.',
    },
    {
      title: 'Certification Topics: subparts and subsections together',
      text: 'Subparts and subsections now live together under Certification Topics. The topics of the book are listed on the left, each with its number of subsections. Selecting a topic shows its subsections, and how many regulations each one holds. Add Subpart takes the code, description, sort order and active state, and Add Subsection takes the code and title.',
    },
    {
      title: 'By topic: read it like a book',
      text: 'Opening a subsection lists its regulations, so the library reads like a book: topic, subsection, rule. From here, a regulation can be added, viewed or edited without leaving the topic.',
    },
    {
      title: 'Regulation Groups: a modification and its rules',
      text: 'Regulation Groups brings the two group screens together. Groups, such as a galley modification, are listed on the left, and the selected group shows the rules it usually affects. Rules are attached from inside the group. The result is one library for every rule: find it in the list, read it in place, organise it by topic, and group it by the kind of modification.',
    },
  ],
}
