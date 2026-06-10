/** Kitchen Academy — culinary school directories and degree programs */

export const ACADEMY_DIRECTORIES = [
  {
    id: 'directory.classical_culinary',
    title: 'Classical Culinary Institute',
    tagline: 'Brigade training from first sear to executive pass',
    summary:
      'The flagship school — French technique, station discipline, and the career ladder from home cook to executive chef, plus garde manger cold kitchen mastery.',
    location: 'Main campus · Hot & cold kitchens',
    programs: [
      {
        track_id: 'track.amateur_to_executive',
        degree_type: 'associate',
        degree_label: 'Associate in Culinary Arts',
        credential: 'ACA',
        estimated_hours: 1200,
      },
      {
        track_id: 'track.garde_manger',
        degree_type: 'certificate',
        degree_label: 'Certificate in Garde Manger',
        credential: 'CGM',
        estimated_hours: 480,
      },
    ],
  },
  {
    id: 'directory.pastry_arts',
    title: 'Pastry & Baking Academy',
    tagline: 'Precision, lamination, and pastry leadership',
    summary:
      'Dedicated baking campus — measure by weight, master fermentation, laminated dough, chocolate, and the pastry chef mindset.',
    location: 'Baking lab · Pastry studio',
    programs: [
      {
        track_id: 'track.master_baker',
        degree_type: 'diploma',
        degree_label: 'Diploma in Pastry Arts',
        credential: 'DPA',
        estimated_hours: 960,
      },
    ],
  },
  {
    id: 'directory.competition_studio',
    title: 'Competition & Television Studio',
    tagline: 'Speed, replication, and pressure-cooker performance',
    summary:
      'Train like the shows — quickfire timing, replication drills, brigade wars, and iron-chef style basket cooking under the clock.',
    location: 'Studio kitchen · Timed stations',
    programs: [
      {
        track_id: 'track.game_show',
        degree_type: 'certificate',
        degree_label: 'Competition Kitchen Certificate',
        credential: 'CKC',
        estimated_hours: 360,
      },
    ],
  },
  {
    id: 'directory.plant_hospitality',
    title: 'Plant-Forward & Hospitality School',
    tagline: 'Vegetable-first cooking and service leadership',
    summary:
      'Modern culinary education — plant-based technique without compromise, plus hospitality, hosting, and kitchen leadership for service-minded cooks.',
    location: 'Teaching restaurant · Event studio',
    programs: [
      {
        track_id: 'track.plant_forward',
        degree_type: 'certificate',
        degree_label: 'Plant-Based Culinary Certificate',
        credential: 'PBC',
        estimated_hours: 520,
      },
      {
        track_id: 'track.hospitality',
        degree_type: 'certificate',
        degree_label: 'Hospitality Leadership Certificate',
        credential: 'HLC',
        estimated_hours: 400,
      },
    ],
  },
  {
    id: 'directory.world_studies',
    title: 'Global Cuisine Institute',
    tagline: 'Six regions, one passport kitchen',
    summary:
      'Regional deep dives across Asia, Mediterranean, Latin America, Middle East, Africa, and a fusion capstone — aromatics, staples, and signature dishes per culture.',
    location: 'World kitchens wing',
    programs: [
      {
        track_id: 'track.global_cuisines',
        degree_type: 'diploma',
        degree_label: 'World Cuisines Diploma',
        credential: 'WCD',
        estimated_hours: 720,
      },
    ],
  },
];
