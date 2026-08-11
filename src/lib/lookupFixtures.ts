import type { AircraftModel, AircraftSerial, AtaChapter, AtaSubChapter, Company, CompanyContact } from '@/types/lookup'

/**
 * Lookup data taken verbatim from the client's Lookup Tables screenshots
 * (business records, not personal data), plus the companies/contacts/aircraft
 * the app's project fixtures already reference — so pickers stay consistent
 * across the prototype.
 */

export const COMPANIES_LOOKUP: Company[] = [
  { id: 'co-aircanada', name: 'Air Canada', address1: '730 Cote Vertu West', address2: '', city: 'Dorval', provState: 'Quebec', country: 'Canada', postal: 'H4Y 1C2', phone: '', active: false },
  { id: 'co-airx', name: 'AirX', address1: 'The Old Treasury Building', address2: 'Saint Angelo Waterfront', city: 'Vittoriosa', provState: 'BRG', country: 'Malta', postal: '1721', phone: '', active: false },
  { id: 'co-aerolia', name: 'Aerolia Canada', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: false },
  { id: 'co-dehavilland', name: 'De Havilland', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: true },
  { id: 'co-bcci', name: 'BCCI (Bombardier Completion Centre)', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: false },
  { id: 'co-canadair', name: 'Bombardier-Canadair', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: false },
  { id: 'co-shaw', name: 'Shaw', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: false },
  { id: 'co-heroux', name: 'Heroux-Devtek', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: false },
  { id: 'co-sino', name: 'Sino Swearinigen', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: false },
  { id: 'co-jmj', name: 'JMJ Aeronautique', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: true },
  { id: 'co-flightdata', name: 'Flight Data Technologies', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: true },
  { id: 'co-airniugini', name: 'Air Niugini', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: true },
  { id: 'co-deca', name: 'DECA Aviation', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: true },
  { id: 'co-hawker', name: 'Hawker Pacific Pty Ltd', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: true },
  { id: 'co-ramm', name: 'RAMM Aerospace', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: true },
  // Companies the project fixtures already use — active so pickers list them.
  { id: 'co-northwind', name: 'Northwind Aerospace', address1: '', address2: '', city: 'Montreal', provState: 'Quebec', country: 'Canada', postal: '', phone: '', active: true },
  { id: 'co-duncan', name: 'Duncan Aviation', address1: '', address2: '', city: 'Lincoln', provState: 'Nebraska', country: 'USA', postal: '', phone: '', active: true },
  { id: 'co-topaces', name: 'Top Aces', address1: '', address2: '', city: 'Dorval', provState: 'Quebec', country: 'Canada', postal: '', phone: '', active: true },
  { id: 'co-abudhabi', name: 'Abu Dhabi Aviation', address1: '', address2: '', city: 'Abu Dhabi', provState: '', country: 'UAE', postal: '', phone: '', active: true },
  { id: 'co-meridian', name: 'Meridian Charter', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: true },
  { id: 'co-elisen', name: 'Elisen', address1: '', address2: '', city: 'Montreal', provState: 'Quebec', country: 'Canada', postal: '', phone: '', active: true },
]

export const COMPANY_CONTACTS: CompanyContact[] = [
  { id: 'ct-remi', companyId: 'co-aircanada', fullName: 'Remi Rocheleau', phone: '', active: true },
  { id: 'ct-louise', companyId: 'co-aircanada', fullName: 'Louise Flornoy', phone: '', active: true },
  { id: 'ct-phil', companyId: 'co-airx', fullName: 'Phil Maltby', phone: '', active: true },
  { id: 'ct-alain', companyId: 'co-ramm', fullName: 'Alain Leroux', phone: '', active: true },
  { id: 'ct-patrick', companyId: 'co-jmj', fullName: 'Patrick Phillips', phone: '', active: true },
  { id: 'ct-natalia', companyId: 'co-flightdata', fullName: 'Natalia Bacharnicova', phone: '', active: true },
  { id: 'ct-tahawar', companyId: 'co-airniugini', fullName: 'Tahawar Durrani', phone: '', active: true },
  { id: 'ct-ferdinand', companyId: 'co-airniugini', fullName: 'Ferdinand Almeda', phone: '', active: true },
  { id: 'ct-greg', companyId: 'co-deca', fullName: 'Greg Brander', phone: '', active: true },
  { id: 'ct-neville', companyId: 'co-hawker', fullName: 'Neville Evans', phone: '', active: true },
  // Contacts the project fixtures already reference.
  { id: 'ct-nathalie', companyId: 'co-northwind', fullName: 'Nathalie Gagnon', phone: '', active: true },
  { id: 'ct-priya', companyId: 'co-duncan', fullName: 'Priya Raman', phone: '', active: true },
  { id: 'ct-marc', companyId: 'co-topaces', fullName: 'Marc Lefebvre', phone: '', active: true },
  { id: 'ct-yusuf', companyId: 'co-abudhabi', fullName: 'Yusuf Haddad', phone: '', active: true },
  { id: 'ct-jane', companyId: 'co-meridian', fullName: 'Jane Doe', phone: '', active: true },
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
  { id: 'sn-593', aircraftId: 'am-lear35a', serial: '593', registration: 'C-GTXM', comment: '', active: true },
  { id: 'sn-649', aircraftId: 'am-lear35a', serial: '649', registration: 'C-GTXE', comment: '', active: true },
  { id: 'sn-653', aircraftId: 'am-lear35a', serial: '653', registration: 'C-GTXS', comment: '', active: true },
  { id: 'sn-33423', aircraftId: 'am-76733a', serial: '33423', registration: 'C-GHPE', comment: '2021-04-14 - Deleted from TCCA registry', active: true },
  { id: 'sn-33424', aircraftId: 'am-76733a', serial: '33424', registration: 'C-GHPN', comment: '', active: true },
  { id: 'sn-27135', aircraftId: 'am-767300', serial: '27135', registration: 'C-FMIJ', comment: '', active: true },
  { id: 'sn-27136', aircraftId: 'am-767300', serial: '27136', registration: 'N342AX', comment: '', active: true },
  // Rest of the screenshot's serial/registration rows — the model column
  // wasn't visible in that crop, so these are linked to the remaining
  // business-jet-type models rather than left out of the table.
  { id: 'sn-199', aircraftId: 'am-astra', serial: '199', registration: 'C-FTLH', comment: '', active: true },
  { id: 'sn-9033', aircraftId: 'am-be350', serial: '9033', registration: 'M-YGJL', comment: '', active: true },
  { id: 'sn-5412', aircraftId: 'am-alphajet', serial: '5412', registration: 'M-AFAC', comment: '', active: true },
]

export const ATA_CHAPTERS: AtaChapter[] = [
  { id: 'ata-01', chapter: '01', title: '*Reserved for Airline Use', definition: '', sort: 1, active: false },
  { id: 'ata-02', chapter: '02', title: '*Reserved for Airline Use', definition: '', sort: 2, active: false },
  { id: 'ata-03', chapter: '03', title: '*Reserved for Airline Use', definition: '', sort: 3, active: false },
  { id: 'ata-04', chapter: '04', title: '*Reserved for Airline Use', definition: '', sort: 4, active: false },
  { id: 'ata-05', chapter: '05', title: 'TIME LIMITS/MAINTENANCE CHECKS', definition: "Manufacturers' recommended time limits for inspections, maintenance checks and inspections (both scheduled and unscheduled).", sort: 5, active: true },
  { id: 'ata-06', chapter: '06', title: 'DIMENSIONS AND AREAS', definition: 'Those charts, diagrams, and text which show the area, dimensions, stations, access doors/zoning (Ref. [Heading 3-1-3.3]) and physical locations, of the major structural members of the aircraft. Includes an explanation of the system of zoning and measurement used.', sort: 6, active: true },
  { id: 'ata-07', chapter: '07', title: 'LIFTING & SHORING', definition: 'This chapter shall include the necessary procedures to lift & shore aircraft in any of the conditions to which it may be subjected. Includes lifting and shoring procedures that may be employed during aircraft maintenance and repair.', sort: 7, active: true },
  { id: 'ata-08', chapter: '08', title: 'LEVELING & WEIGHING', definition: 'This chapter shall include the necessary information to properly level the aircraft for any of the various maintenance, overhaul or major repairs which might become necessary during the life of the aircraft. It shall also include those units or components which are specifically dedicated to record, store or compute weight and balance data. Includes those maintenance practices necessary to prepare the aircraft for weighing.', sort: 8, active: true },
  { id: 'ata-09', chapter: '09', title: 'TOWING & TAXIING', definition: 'Those instructions necessary to tow and taxi the aircraft. Charts showing location of attachment points, turning radius, etc., shall be included. Includes those maintenance practices necessary to prepare the aircraft for towing and taxiing.', sort: 9, active: true },
  { id: 'ata-10', chapter: '10', title: 'PARKING, MOORING, STORAGE & RETURN', definition: 'Those instructions necessary to park, store, moor and prepare the aircraft for service in any of the conditions to which it may be subjected. Charts showing location of landing gear and control surface locks, blanking plugs and covers.', sort: 10, active: true },
  { id: 'ata-25', chapter: '25', title: 'EQUIPMENT/FURNISHINGS', definition: 'Those removable items of equipment and furnishings contained in the flight and passenger compartments. Includes emergency, galley and lavatory equipment.', sort: 25, active: true },
]

export const ATA_SUB_CHAPTERS: AtaSubChapter[] = [
  { id: 'atas-0100', chapterId: 'ata-01', section: '00', title: 'General', definition: '', sort: 100, active: false },
  { id: 'atas-0200', chapterId: 'ata-02', section: '00', title: 'General', definition: '', sort: 200, active: false },
  { id: 'atas-0300', chapterId: 'ata-03', section: '00', title: 'General', definition: '', sort: 300, active: false },
  { id: 'atas-0400', chapterId: 'ata-04', section: '00', title: 'General', definition: '', sort: 400, active: false },
  { id: 'atas-0500', chapterId: 'ata-05', section: '00', title: 'General', definition: '', sort: 500, active: true },
  { id: 'atas-0510', chapterId: 'ata-05', section: '10', title: 'Time Limits', definition: "Those manufacturer recommended time limits for inspections, maintenance and overhaul of the aircraft, its systems and units, and life of parts. For engine manufacturers this will include the flight cycle lives of major rotating components and other items designated critical. NOTE: Inclusion of the data described above, in any manual or manual publication is specifically prohibited unless required by government regulation. Airlines desire the manufacturer's recommended time limits and scheduled maintenance checks but these should be provided in a separate document.", sort: 510, active: true },
  { id: 'atas-0520', chapterId: 'ata-05', section: '20', title: 'Scheduled Maintenance Checks', definition: 'Those manufacturer recommended maintenance checks and inspections of the aircraft, its systems and units dictated by the time limits specified in -10 above. This section shall list in more detail the items which are outlined on the airline job forms (usually by title only), and shall cross-reference the detailed procedures included in the individual Maintenance Practices.', sort: 520, active: true },
  { id: 'atas-0530', chapterId: 'ata-05', section: '30', title: 'Scheduled Maintenance Checks', definition: '-30 & -40: Reserved for use in those cases where the number of breakouts provided by the fourth digit of the -20 breakout is not sufficient to cover all of the maintenance checks dictated by subsystem -10 above.', sort: 530, active: true },
  { id: 'atas-2510', chapterId: 'ata-25', section: '10', title: 'Flight Compartment', definition: 'Equipment and furnishings located in the flight compartment.', sort: 2510, active: true },
  { id: 'atas-2520', chapterId: 'ata-25', section: '20', title: 'Passenger Compartment', definition: 'Equipment and furnishings located in the passenger compartment, including seats and tables.', sort: 2520, active: true },
]
