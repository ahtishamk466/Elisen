import type { AircraftModel, AircraftSerial, AtaChapter, AtaSubChapter, Company, CompanyContact } from '@/types/lookup'

/**
 * Lookup data taken verbatim from the client's Lookup Tables screenshots
 * (business records, not personal data), plus the companies/contacts/aircraft
 * the app's project fixtures already reference — so pickers stay consistent
 * across the prototype.
 */

export const COMPANIES_LOOKUP: Company[] = [
  { id: 'co-aircanada', name: 'Air Canada', address: '730 Cote Vertu West, Quebec', city: 'Dorval', country: 'Canada', postal: 'H4Y 1C2', active: false },
  { id: 'co-airx', name: 'AirX', address: 'The Old Treasury Building, Saint Angelo Waterfront, BRG', city: 'Vittoriosa', country: 'Malta', postal: '1721', active: false },
  { id: 'co-aerolia', name: 'Aerolia Canada', address: '', city: '', country: '', postal: '', active: false },
  { id: 'co-dehavilland', name: 'De Havilland', address: '', city: '', country: '', postal: '', active: true },
  { id: 'co-bcci', name: 'BCCI (Bombardier Completion Centre)', address: '', city: '', country: '', postal: '', active: false },
  { id: 'co-canadair', name: 'Bombardier-Canadair', address: '', city: '', country: '', postal: '', active: false },
  { id: 'co-shaw', name: 'Shaw', address: '', city: '', country: '', postal: '', active: false },
  { id: 'co-heroux', name: 'Heroux-Devtek', address: '', city: '', country: '', postal: '', active: false },
  { id: 'co-sino', name: 'Sino Swearinigen', address: '', city: '', country: '', postal: '', active: false },
  { id: 'co-jmj', name: 'JMJ Aeronautique', address: '', city: '', country: '', postal: '', active: true },
  { id: 'co-flightdata', name: 'Flight Data Technologies', address: '', city: '', country: '', postal: '', active: true },
  { id: 'co-airniugini', name: 'Air Niugini', address: '', city: '', country: '', postal: '', active: true },
  { id: 'co-deca', name: 'DECA Aviation', address: '', city: '', country: '', postal: '', active: true },
  { id: 'co-hawker', name: 'Hawker Pacific Pty Ltd', address: '', city: '', country: '', postal: '', active: true },
  { id: 'co-ramm', name: 'RAMM Aerospace', address: '', city: '', country: '', postal: '', active: true },
  // Companies the project fixtures already use — active so pickers list them.
  { id: 'co-northwind', name: 'Northwind Aerospace', address: 'Quebec', city: 'Montreal', country: 'Canada', postal: '', active: true },
  { id: 'co-duncan', name: 'Duncan Aviation', address: 'Nebraska', city: 'Lincoln', country: 'USA', postal: '', active: true },
  { id: 'co-topaces', name: 'Top Aces', address: 'Quebec', city: 'Dorval', country: 'Canada', postal: '', active: true },
  { id: 'co-abudhabi', name: 'Abu Dhabi Aviation', address: '', city: 'Abu Dhabi', country: 'UAE', postal: '', active: true },
  { id: 'co-meridian', name: 'Meridian Charter', address: '', city: '', country: '', postal: '', active: true },
  { id: 'co-elisen', name: 'Elisen', address: 'Quebec', city: 'Montreal', country: 'Canada', postal: '', active: true },
]

export const COMPANY_CONTACTS: CompanyContact[] = [
  { id: 'ct-remi', companyId: 'co-aircanada', fullName: 'Remi Rocheleau', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-louise', companyId: 'co-aircanada', fullName: 'Louise Flornoy', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-remi3', companyId: 'co-aircanada', fullName: 'Sylvie Tremblay', phoneCountryCode: '+1', phoneNumber: '514-555-0142', active: true },
  { id: 'ct-phil', companyId: 'co-airx', fullName: 'Phil Maltby', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-alain', companyId: 'co-ramm', fullName: 'Alain Leroux', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-patrick', companyId: 'co-jmj', fullName: 'Patrick Phillips', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-natalia', companyId: 'co-flightdata', fullName: 'Natalia Bacharnicova', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-tahawar', companyId: 'co-airniugini', fullName: 'Tahawar Durrani', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-ferdinand', companyId: 'co-airniugini', fullName: 'Ferdinand Almeda', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-greg', companyId: 'co-deca', fullName: 'Greg Brander', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-neville', companyId: 'co-hawker', fullName: 'Neville Evans', phoneCountryCode: '', phoneNumber: '', active: true },
  // Contacts the project fixtures already reference.
  { id: 'ct-nathalie', companyId: 'co-northwind', fullName: 'Nathalie Gagnon', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-priya', companyId: 'co-duncan', fullName: 'Priya Raman', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-marc', companyId: 'co-topaces', fullName: 'Marc Lefebvre', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-yusuf', companyId: 'co-abudhabi', fullName: 'Yusuf Haddad', phoneCountryCode: '', phoneNumber: '', active: true },
  { id: 'ct-jane', companyId: 'co-meridian', fullName: 'Jane Doe', phoneCountryCode: '', phoneNumber: '', active: true },
]

export const AIRCRAFT_MODELS: AircraftModel[] = [
  { id: 'am-a320', modelNumber: 'A320', modelName: 'Airbus A320', manufacturer: 'Airbus', tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: 'AB', active: false },
  { id: 'am-a330', modelNumber: 'A330', modelName: 'Airbus A330', manufacturer: 'Airbus', tccaTc: 'A-151', faaTc: '', easaTc: '', drawingPrefix: 'AB', active: false },
  { id: 'am-a4n', modelNumber: 'A-4N', modelName: 'Douglas A-4N', manufacturer: 'Douglas', tccaTc: 'N/A', faaTc: 'N/A', easaTc: 'N/A', drawingPrefix: 'MD', active: false },
  { id: 'am-alphajet', modelNumber: 'Alpha Jet', modelName: 'Dornier', manufacturer: 'Dassault/Dornier', tccaTc: 'N/A', faaTc: 'N/A', easaTc: 'N/A', drawingPrefix: 'AJ', active: false },
  { id: 'am-astra', modelNumber: 'Astra SPX', modelName: 'Israel Aircraft Astra SPX / Gulfsream 100', manufacturer: 'IAI', tccaTc: 'A-202', faaTc: '', easaTc: '', drawingPrefix: 'WW', active: false },
  { id: 'am-atr42', modelNumber: 'ATR 42-500', modelName: 'ATR', manufacturer: 'Avions de transport régional', tccaTc: 'A-159', faaTc: '', easaTc: '', drawingPrefix: 'AT', active: false },
  { id: 'am-atr72', modelNumber: 'ATR 72', modelName: 'ATR', manufacturer: 'Avions de transport régional', tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: 'AT', active: false },
  { id: 'am-727', modelNumber: '727', modelName: 'Boeing 727 Series', manufacturer: 'Boeing', tccaTc: 'FAA A3WE', faaTc: 'A3WE', easaTc: '', drawingPrefix: 'BA', active: true },
  { id: 'am-72723', modelNumber: '727-23', modelName: 'Boeing 727 Series', manufacturer: 'Boeing', tccaTc: 'FAA A3WE', faaTc: 'A3WE', easaTc: '', drawingPrefix: 'BA', active: true },
  { id: 'am-747400', modelNumber: '747-400', modelName: 'Boeing 747-400 Series', manufacturer: 'Boeing', tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: 'BA', active: true },
  // Parents of the serial-number rows on the screenshot's first page.
  { id: 'am-lear35a', modelNumber: 'Lear 35A', modelName: 'Learjet 35A', manufacturer: 'Bombardier Learjet', tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: 'LJ', active: true },
  { id: 'am-76733a', modelNumber: '767-33A', modelName: 'Boeing 767 Series', manufacturer: 'Boeing', tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: 'BA', active: true },
  { id: 'am-767300', modelNumber: '767-300', modelName: 'Boeing 767 Series', manufacturer: 'Boeing', tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: 'BA', active: true },
  // Models the project fixtures already reference.
  { id: 'am-be350', modelNumber: 'BE350', modelName: 'King Air 350', manufacturer: 'Beechcraft', tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: 'KA', active: true },
  { id: 'am-737800', modelNumber: '737-8', modelName: 'B737-800', manufacturer: 'Boeing', tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: 'BA', active: true },
]

export const AIRCRAFT_SERIALS: AircraftSerial[] = [
  { id: 'sn-593', aircraftId: 'am-lear35a', serial: '593', registration: 'C-GTXM',
    ownerName: 'Remi Rocheleau', company: 'Air Canada',
    addressLine1: '730 Cote Vertu West', addressLine2: '', city: 'Dorval', provState: 'QC',
    country: 'Canada', postalZipcode: 'H4Y 1C2', telephone: '+1 514-555-0142', email: 'fleet@aircanada.example', comment: '', active: true },
  { id: 'sn-649', aircraftId: 'am-lear35a', serial: '649', registration: 'C-GTXE',
    ownerName: 'Louise Flornoy', company: 'Air Canada',
    addressLine1: '730 Cote Vertu West', addressLine2: '', city: 'Dorval', provState: 'QC',
    country: 'Canada', postalZipcode: 'H4Y 1C2', telephone: '+1 514-555-0188', email: 'records@aircanada.example', comment: '', active: true },
  { id: 'sn-653', aircraftId: 'am-lear35a', serial: '653', registration: 'C-GTXS',
    ownerName: 'Tahawar Durrani', company: 'Air Niugini',
    addressLine1: 'Jacksons Airport', addressLine2: 'PO Box 7186', city: 'Port Moresby', provState: 'NCD',
    country: 'Papua New Guinea', postalZipcode: '121', telephone: '+675 327 3444', email: 'ops@airniugini.example', comment: '', active: true },
  { id: 'sn-33423', aircraftId: 'am-76733a', serial: '33423', registration: 'C-GHPE',
    ownerName: 'Priya Raman', company: 'Duncan Aviation',
    addressLine1: '3701 Aviation Road', addressLine2: '', city: 'Lincoln', provState: 'NE',
    country: 'USA', postalZipcode: '68524', telephone: '+1 402-555-0110', email: 'records@duncan.example', comment: '2021-04-14 - Deleted from TCCA registry', active: true },
  { id: 'sn-33424', aircraftId: 'am-76733a', serial: '33424', registration: 'C-GHPN',
    ownerName: 'Marc Lefebvre', company: 'Top Aces',
    addressLine1: '10 Rue de Aviation', addressLine2: '', city: 'Dorval', provState: 'QC',
    country: 'Canada', postalZipcode: 'H9P 1J1', telephone: '+1 514-555-0163', email: 'fleet@topaces.example', comment: '', active: true },
  { id: 'sn-27135', aircraftId: 'am-767300', serial: '27135', registration: 'C-FMIJ',
    ownerName: 'Yusuf Haddad', company: 'Abu Dhabi Aviation',
    addressLine1: 'Al Bateen Airport', addressLine2: '', city: 'Abu Dhabi', provState: '',
    country: 'UAE', postalZipcode: '', telephone: '+971 2 575 8000', email: 'ops@adaviation.example', comment: '', active: true },
  { id: 'sn-27136', aircraftId: 'am-767300', serial: '27136', registration: 'N342AX',
    ownerName: 'Annick Bergeron', company: 'CAE',
    addressLine1: '8585 Cote-de-Liesse', addressLine2: '', city: 'Saint-Laurent', provState: 'QC',
    country: 'Canada', postalZipcode: 'H4T 1G6', telephone: '+1 514-555-0125', email: 'fleet@cae.example', comment: '', active: true },
  // Rest of the screenshot's serial/registration rows — the model column
  // wasn't visible in that crop, so these are linked to the remaining
  // business-jet-type models rather than left out of the table.
  { id: 'sn-199', aircraftId: 'am-astra', serial: '199', registration: 'C-FTLH',
    ownerName: 'Remi Rocheleau', company: 'Air Canada',
    addressLine1: '730 Cote Vertu West', addressLine2: '', city: 'Dorval', provState: 'QC',
    country: 'Canada', postalZipcode: 'H4Y 1C2', telephone: '+1 514-555-0142', email: 'fleet@aircanada.example', comment: '', active: true },
  { id: 'sn-9033', aircraftId: 'am-be350', serial: '9033', registration: 'M-YGJL',
    ownerName: 'Louise Flornoy', company: 'Air Canada',
    addressLine1: '730 Cote Vertu West', addressLine2: '', city: 'Dorval', provState: 'QC',
    country: 'Canada', postalZipcode: 'H4Y 1C2', telephone: '+1 514-555-0188', email: 'records@aircanada.example', comment: '', active: true },
  { id: 'sn-5412', aircraftId: 'am-alphajet', serial: '5412', registration: 'M-AFAC',
    ownerName: 'Tahawar Durrani', company: 'Air Niugini',
    addressLine1: 'Jacksons Airport', addressLine2: 'PO Box 7186', city: 'Port Moresby', provState: 'NCD',
    country: 'Papua New Guinea', postalZipcode: '121', telephone: '+675 327 3444', email: 'ops@airniugini.example', comment: '', active: true },
]

/**
 * The ATA 100 chapter list as the industry uses it, plus the client's own
 * extensions — 01–04 airline-reserved and 92 wiring — because the taxonomy is
 * a base that OEMs and airlines add to, and the module must carry non-standard
 * chapters without complaint.
 *
 * Generated from a compact seed table so the ids stay derived from the codes
 * (`ata-05`, `atas-0510`): in the ATA spec the code *is* the identity. Every
 * chapter carries a `00 — General` section, exactly as the client's own data
 * does; curated sections beyond that exist where the demo's drawings and
 * screenshots need them.
 */
type ChapterSeed = [code: string, title: string, definition: string, active?: boolean]

const ATA_CHAPTER_SEEDS: ChapterSeed[] = [
  ['01', '*Reserved for airline use', '', false],
  ['02', '*Reserved for airline use', '', false],
  ['03', '*Reserved for airline use', '', false],
  ['04', '*Reserved for airline use', '', false],
  ['05', 'Time limits/maintenance checks', "Manufacturers' recommended time limits for inspections, maintenance checks and inspections (both scheduled and unscheduled)."],
  ['06', 'Dimensions and areas', 'Those charts, diagrams, and text which show the area, dimensions, stations, access doors/zoning and physical locations of the major structural members of the aircraft. Includes an explanation of the system of zoning and measurement used.'],
  ['07', 'Lifting & shoring', 'The necessary procedures to lift and shore the aircraft in any of the conditions to which it may be subjected, including during maintenance and repair.'],
  ['08', 'Leveling & weighing', 'The information needed to level the aircraft for maintenance, overhaul or major repair, and the practices needed to prepare the aircraft for weighing.'],
  ['09', 'Towing & taxiing', 'Instructions for towing and taxiing the aircraft, with charts showing attachment points, turning radius and related limits.'],
  ['10', 'Parking, mooring, storage & return', 'Instructions for parking, storing and mooring the aircraft and preparing it for return to service, including locations of locks, blanking plugs and covers.'],
  ['11', 'Placards and markings', 'Exterior and interior placards, markings and signs, and their required locations.'],
  ['12', 'Servicing', 'Replenishing fluids and gases, scheduled servicing and routine attention that does not require disassembly.'],
  ['20', 'Standard practices — airframe', 'Standard maintenance practices applying to the airframe as a whole rather than to one system.'],
  ['21', 'Air conditioning', 'Units and components which furnish a means of pressurizing, heating, cooling, moisture controlling and filtering the cabin air.'],
  ['22', 'Auto flight', 'Units and components which furnish a means of automatically controlling the flight of the aircraft, including the autothrottle and yaw damper.'],
  ['23', 'Communications', 'Units and components which furnish a means of communicating internally and externally, including audio integrating and static discharge.'],
  ['24', 'Electrical power', 'Units and components which generate, control and supply AC and/or DC electrical power, including generation, distribution and load management.'],
  ['25', 'Equipment/furnishings', 'Those removable items of equipment and furnishings contained in the flight and passenger compartments. Includes emergency, galley and lavatory equipment.'],
  ['26', 'Fire protection', 'Units and components which detect and indicate fire or smoke and store and distribute fire extinguishing agent.'],
  ['27', 'Flight controls', 'Units and components which furnish a means of manually controlling the flight attitude characteristics of the aircraft.'],
  ['28', 'Fuel', 'Units and components which store and deliver fuel to the engine, including tanks, pumps, valves and indicating.'],
  ['29', 'Hydraulic power', 'Units and components which furnish hydraulic fluid under pressure to a common point for actuating other systems.'],
  ['30', 'Ice and rain protection', 'Units and components which provide a means of preventing or disposing of ice and rain on the aircraft.'],
  ['31', 'Indicating/recording systems', 'Instruments, recorders and central computers, and the systems which integrate indicating and recording.'],
  ['32', 'Landing gear', 'Units and components which furnish a means of supporting and steering the aircraft on the ground, and retracting the gear in flight.'],
  ['33', 'Lights', 'Units and components which provide interior and exterior illumination, including warning, emergency and instrument lighting.'],
  ['34', 'Navigation', 'Units and components which provide aircraft navigational information, from flight environment data to position determining and landing aids.'],
  ['35', 'Oxygen', 'Units and components which store, regulate and deliver oxygen to the passengers and crew.'],
  ['36', 'Pneumatic', 'Units and components which deliver compressed air from a power source to using systems.'],
  ['38', 'Water/waste', 'Units and components which store and deliver fresh water and dispose of waste water.'],
  ['45', 'Central maintenance system', 'The central computer systems which collect, store and display aircraft maintenance data.'],
  ['49', 'Airborne auxiliary power', 'Airborne power plants installed for generating and supplying auxiliary electric, hydraulic and pneumatic power.'],
  ['51', 'Standard practices & structures', 'Standard practices and general structural information, including repair schemes applicable to more than one structural chapter.'],
  ['52', 'Doors', 'Passenger, crew, cargo and service doors, with their actuating mechanisms, warning and safety devices.'],
  ['53', 'Fuselage', 'The structural units and associated components which make up the fuselage, including frames, skin and pressure bulkheads.'],
  ['54', 'Nacelles/pylons', 'The structural units and associated components which furnish a means of housing and mounting the power plant.'],
  ['55', 'Stabilizers', 'The structural units and associated components of the horizontal and vertical stabilizers.'],
  ['56', 'Windows', 'Windows, windshields and their surrounding structure, including flight compartment and cabin windows.'],
  ['57', 'Wings', 'The structural units and associated components which make up the wing, including the center wing box, flaps and slat structure.'],
  ['61', 'Propellers', 'The propeller assembly, its controlling, braking and indicating systems.'],
  ['71', 'Power plant', 'The complete power plant package, its cowling, mounts and general practices applying to the installation as a whole.'],
  ['72', 'Engine', 'The engine itself — compressor, combustion, turbine and accessory drive sections.'],
  ['73', 'Engine fuel and control', 'Units and components which deliver metered fuel to the engine, including engine-driven pumps, controls and indicating.'],
  ['74', 'Ignition', 'Units and components which generate, control and distribute the electrical current to ignite the fuel-air mixture.'],
  ['76', 'Engine controls', 'Units and components which control engine operation from the flight compartment, including emergency shutdown.'],
  ['77', 'Engine indicating', 'Units and components which indicate engine operation, including power, temperature and analyzer systems.'],
  ['78', 'Exhaust', 'Units and components which direct the engine exhaust gases overboard, including thrust reversers and noise suppressors.'],
  ['79', 'Oil', 'Units and components external to the engine which store, deliver and indicate the engine lubricating oil.'],
  ['80', 'Starting', 'Units and components which furnish a means of starting the engine, including cranking systems.'],
  // The client's own extension, outside the ATA 100 standard: wiring diagrams
  // are filed here. Kept because the module must accept non-standard chapters.
  ['92', 'Aircraft wiring', 'Wiring diagrams and electrical installation drawings, filed by system. A client extension to the standard ATA chapter list.'],
]

type SectionSeed = [chapter: string, section: string, title: string, definition: string]

const ATA_SECTION_SEEDS: SectionSeed[] = [
  ['05', '10', 'Time limits', "Those manufacturer recommended time limits for inspections, maintenance and overhaul of the aircraft, its systems and units, and life of parts. For engine manufacturers this will include the flight cycle lives of major rotating components and other items designated critical. NOTE: Inclusion of the data described above, in any manual or manual publication is specifically prohibited unless required by government regulation. Airlines desire the manufacturer's recommended time limits and scheduled maintenance checks but these should be provided in a separate document."],
  ['05', '20', 'Scheduled maintenance checks', 'Those manufacturer recommended maintenance checks and inspections of the aircraft, its systems and units dictated by the time limits specified in -10 above. This section shall list in more detail the items which are outlined on the airline job forms (usually by title only), and shall cross-reference the detailed procedures included in the individual Maintenance Practices.'],
  ['05', '30', 'Scheduled maintenance checks', '-30 & -40: Reserved for use in those cases where the number of breakouts provided by the fourth digit of the -20 breakout is not sufficient to cover all of the maintenance checks dictated by subsystem -10 above.'],
  ['05', '50', 'Unscheduled maintenance checks', 'Those checks required after hard landings, severe turbulence, lightning strike or other unusual occurrences.'],
  ['24', '30', 'DC generation', 'Units and components which generate, regulate, control and indicate DC electrical power.'],
  ['24', '50', 'Electrical load distribution', 'Units and components which distribute AC and DC electrical power to using systems, including buses and circuit breakers.'],
  ['25', '10', 'Flight compartment', 'Equipment and furnishings located in the flight compartment.'],
  ['25', '20', 'Passenger compartment', 'Equipment and furnishings located in the passenger compartment, including seats and tables.'],
  ['25', '30', 'Galley', 'Removable galley equipment and furnishings, including inserts and trolleys.'],
  ['25', '40', 'Lavatories', 'Removable lavatory equipment and furnishings.'],
  ['25', '50', 'Cargo compartments', 'Equipment and furnishings of the cargo compartments, including lining and restraint systems.'],
  ['25', '60', 'Emergency', 'Emergency equipment: slides, life vests, first aid and portable extinguishers.'],
  ['33', '10', 'Flight compartment', 'Flight compartment illumination, including instrument and panel lighting.'],
  ['33', '20', 'Passenger compartments', 'Passenger compartment illumination, including signs and reading lights.'],
  ['33', '40', 'Exterior lighting', 'Exterior illumination: navigation, anti-collision, landing and taxi lights.'],
  ['52', '10', 'Passenger/crew doors', 'Passenger and crew doors, their actuating mechanisms and safety devices.'],
  ['52', '30', 'Cargo doors', 'Cargo and service doors, their actuating mechanisms and warning systems.'],
]

export const ATA_CHAPTERS: AtaChapter[] = ATA_CHAPTER_SEEDS.map(
  ([code, title, definition, active = true]) => ({
    id: `ata-${code}`, chapter: code, title, definition, sort: Number(code), active,
  }),
)

export const ATA_SUB_CHAPTERS: AtaSubChapter[] = [
  // Every chapter carries 00 — General, as the client's own list does; a
  // reserved (inactive) chapter's General section follows the chapter's fate.
  ...ATA_CHAPTER_SEEDS.map(([code, , , active = true]) => ({
    id: `atas-${code}00`, chapterId: `ata-${code}`, section: '00', title: 'General', definition: '', sort: Number(`${code}00`), active,
  })),
  ...ATA_SECTION_SEEDS.map(([chapter, section, title, definition]) => ({
    id: `atas-${chapter}${section}`, chapterId: `ata-${chapter}`, section, title, definition, sort: Number(`${chapter}${section}`), active: true,
  })),
]
