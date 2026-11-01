/**
 * The Certification Basis walkthrough video (v4, 2026-11-02) and its narration.
 *
 * Files live in `public/videos/`. The video is produced outside this repo
 * (`~/.codex/outputs/elisen-basis-video-2026-10-31-v2/team-video`, render_team_video_v4.py);
 * the captions come from the same word timings. The transcript is the spoken script,
 * in the video's chapter order, so the page says exactly what the narrator says.
 */
export const WALKTHROUGH = {
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
} as const
