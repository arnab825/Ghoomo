-- =========================================================================
-- Ghoomo - Places Reference 58-Place Demo Seed Data
-- Kaggle Tourism + Wikipedia Commons + data.gov.in
-- Covers: Manali (18), Goa (18), Rishikesh (12), Kasol / Parvati Valley (10)
-- =========================================================================

insert into public.places_reference (
  name, city, state, lat, lng, category, description, image_url, source, popularity_score, search_tokens
) values
  -- 1. MANALI (18 places)
  (
    'Hadimba Devi Temple', 'Manali', 'Himachal Pradesh', 32.2483, 77.1804, 'heritage',
    'Ancient four-tiered wooden pagoda sanctuary built in 1553 CE, nestled in a dense cedar (deodar) forest in Dhungri.',
    'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Kaggle-Himachal-Tourism', 0.98, 'hadimba hidimba devi temple dhungri cedar deodar wood pagoda heritage'
  ),
  (
    'Solang Valley Adventure Ground', 'Manali', 'Himachal Pradesh', 32.3167, 77.1583, 'adventure',
    'Renowned alpine meadow bowl offering skiing in winter and paragliding, quad biking, and zorbing in summer.',
    'https://images.unsplash.com/photo-1586016413664-864c0dd76f53?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Tourism-HP', 0.96, 'solang valley paragliding skiing snow sports rohtang road ropeway adventure'
  ),
  (
    'Jogini Waterfall Trail', 'Manali', 'Himachal Pradesh', 32.2709, 77.1952, 'nature',
    'Scenic 3 km pine forest hike from Vashisht village culminating at cascading falls with panoramic views of the Pir Panjal range.',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Trek-Database', 0.92, 'jogini jogni waterfall vashisht trek hike pine stream cascade'
  ),
  (
    'Vashisht Natural Hot Water Springs & Temple', 'Manali', 'Himachal Pradesh', 32.2619, 77.1895, 'spiritual',
    'Centuries-old sulfur thermal springs celebrated for medicinal virtues, set alongside ornate wood-carved Rishi Vashishta temple.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Kaggle-Himachal-Tourism', 0.88, 'vashisht hot spring sulfur bath rishi temple wood carving'
  ),
  (
    'Old Manali Village & Cultural Quarter', 'Manali', 'Himachal Pradesh', 32.2536, 77.1751, 'culture',
    'Charming historic quarter characterized by traditional Kath-Kuni stone houses, bohemian bakeries, and live folk music jam sessions.',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.93, 'old manali village kath kuni traditional bohemian backpacker cafes'
  ),
  (
    'Manu Temple', 'Manali', 'Himachal Pradesh', 32.2573, 77.1724, 'heritage',
    'India’s sole historical shrine dedicated to Sage Manu, the mythological progenitor of humanity according to ancient texts.',
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Kaggle-Heritage', 0.86, 'manu temple sage manu creator shrine old manali river view'
  ),
  (
    'Mall Road & Tibetan Monasteries', 'Manali', 'Himachal Pradesh', 32.2396, 77.1887, 'shopping',
    'Bustling pedestrian strip lined with Kullu shawls, wooden handicraft emporiums, apple wine shops, and the colorful Gadhan Thekchhokling Gompa.',
    'https://images.unsplash.com/photo-1596464716127-f2a829822301?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/HP-Urban', 0.91, 'mall road shopping kullu shawls tibetan market monastery handicrafts gompa'
  ),
  (
    'Cafe 1947 Beas Riverfront', 'Manali', 'Himachal Pradesh', 32.2558, 77.1782, 'food',
    'Legendary vintage Italian cafe situated directly overlooking the rushing waters of Manalsu/Beas River, famous for thin-crust pizza.',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.94, 'cafe 1947 riverside food pizza live music italian old manali beas'
  ),
  (
    'The Johnson’s Cafe & Bar', 'Manali', 'Himachal Pradesh', 32.2471, 77.1873, 'food',
    'Iconic cedar-shaded garden dining destination renowned for wood-fired trout delicacies and cozy winter fireplace vibes.',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.89, 'johnsons cafe bar trout food garden dining cedar circuit house'
  ),
  (
    'Dylan’s Toasted & Roasted Coffee House', 'Manali', 'Himachal Pradesh', 32.2539, 77.1748, 'food',
    'Cult bohemian coffee shop in Old Manali renowned for fresh baked chocolate chip walnut cookies and artisanal Arabica brews.',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.88, 'dylans coffee house cookies bob dylan bakery roast artisanal cafe'
  ),
  (
    'Rohtang Pass Viewpoint (3,978m)', 'Manali', 'Himachal Pradesh', 32.3716, 77.2466, 'viewpoint',
    'High mountain pass connecting Kullu Valley with the arid highlands of Lahaul & Spiti, offering year-round glaciers and 360° Himalayan vistas.',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/BRO-Highways', 0.99, 'rohtang pass snow snowpoint glaciers 3978m spiti gateway lahaul'
  ),
  (
    'Atal Tunnel North Portal & Sissu Waterfall', 'Manali', 'Himachal Pradesh', 32.4975, 77.1652, 'adventure',
    'Engineering marvel passing under Rohtang Pass, opening into the dramatically barren Chandra valley and Sissu glacial waterfall.',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.97, 'atal tunnel sissu waterfall lahaul chandra river north portal snow drive'
  ),
  (
    'Van Vihar National Park', 'Manali', 'Himachal Pradesh', 32.2372, 77.1899, 'nature',
    'Peaceful municipal nature reserve flanking Mall Road with soaring deodar canopies and paddle boating in a natural pond.',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/HP-Forests', 0.82, 'van vihar national park deodar forest boating lake mall road walk'
  ),
  (
    'Naggar Castle Heritage Complex', 'Manali', 'Himachal Pradesh', 32.1469, 77.1706, 'heritage',
    '15th-century wood-and-stone palace of the Kullu Rajas overlooking the Beas valley, featuring Roerich Art Gallery and Himalayan architecture.',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/ASI-India', 0.90, 'naggar castle heritage kullu rajas roerich art kath kuni beas palace'
  ),
  (
    'Gulaba Snow Viewpoint & Meadow', 'Manali', 'Himachal Pradesh', 32.3188, 77.2023, 'nature',
    'Serene snowline village named after Raja Gulab Singh of Kashmir, popular starting point for the high-altitude Bhrigu Lake trek.',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/HP-Tourism', 0.87, 'gulaba snow meadow bhrigu lake trek rohtang road viewpoint'
  ),
  (
    'Drifter’s Cafe & Lounge', 'Manali', 'Himachal Pradesh', 32.2547, 77.1738, 'food',
    'Sunlit rooftop cafe with board games, craft coffees, comforting shakshuka, and scenic valley views of Manu temple hill.',
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.85, 'drifters cafe old manali rooftop board games shakshuka coffee lounge'
  ),
  (
    'Beas River White Water Rafting (Pirdi)', 'Manali', 'Himachal Pradesh', 31.9686, 77.1122, 'adventure',
    'Thrilling 14 km Grade II & III white water rafting stretch downstream through rocky river gorges between Pirdi and Jhiri.',
    'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.89, 'beas river rafting pirdi kullu rapids grade 3 white water water sports'
  ),
  (
    'Sethan Village & Hampta Pass Basecamp', 'Manali', 'Himachal Pradesh', 32.2215, 77.2341, 'viewpoint',
    'Quaint Buddhist horse-breeding village at 2,700m offering experiential igloo stays, bouldering crags, and stargazing above cloudline.',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Kaggle-Himachal-Tourism', 0.93, 'sethan village hampta pass igloo stay bouldering stargazing buddhist crag'
  ),

  -- 2. GOA (18 places)
  (
    'Palolem Beach & Silent Noise Headland', 'Goa', 'Goa', 15.0099, 74.0232, 'nature',
    'Crescent-shaped white sand bay framed by coconut groves in South Goa, famed for gentle waters, kayak dolphin spotting, and headphone rave parties.',
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Goa-Tourism', 0.97, 'palolem beach south goa silent noise dolphin kayaking canacona sunset'
  ),
  (
    'Basilica of Bom Jesus (UNESCO Heritage)', 'Goa', 'Goa', 15.5009, 73.9116, 'heritage',
    '16th-century landmark of baroque architecture housing the sacred mortal remains of St. Francis Xavier in Old Goa.',
    'https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/ASI-India', 0.98, 'basilica bom jesus unesco old goa church st francis xavier baroque'
  ),
  (
    'Fort Aguada & Candolim Lighthouse', 'Goa', 'Goa', 15.4925, 73.7738, 'heritage',
    '17th-century Portuguese fortress overlooking Sinquerim beach and the Arabian Sea, featuring a 4-storey freshwater reservoir bastion.',
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.95, 'fort aguada sinquerim candolim lighthouse portuguese jail sea view north goa'
  ),
  (
    'Chapora Fort & Vagator Sunset Cliff', 'Goa', 'Goa', 15.6064, 73.7371, 'viewpoint',
    'Red laterite rampart standing high above the Chapora River mouth, celebrated for sunset vistas made famous by Dil Chahta Hai.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Goa-Tourism', 0.96, 'chapora fort vagator dil chahta hai sunset red cliff north goa beach view'
  ),
  (
    'Anjuna Beach & Curlies Beach Shack', 'Goa', 'Goa', 15.5733, 73.7414, 'nightlife',
    'Iconic rocky coast that birthed Goa’s psychedelic trance culture, host to Wednesday Flea Market and beachfront sundowner sets.',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Goa-Beaches', 0.93, 'anjuna beach curlies flea market trance psytrance shack sundowner north goa'
  ),
  (
    'Fontainhas Latin Quarter (Panaji)', 'Goa', 'Goa', 15.4989, 73.8315, 'culture',
    'Asia’s oldest surviving Latin Quarter, lined with bright terracotta roofs, indigo & pastel Portuguese villas, and artisan bakeries.',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.94, 'fontainhas panaji latin quarter portuguese architecture pastel street photo heritage'
  ),
  (
    'Dudhsagar Falls (Mollem National Park)', 'Goa', 'Goa', 15.3144, 74.3143, 'nature',
    'Tiered 310m white cascade resembling a "Sea of Milk" in the Western Ghats jungle, traversed by an iconic railway viaduct.',
    'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Western-Ghats', 0.95, 'dudhsagar waterfall mollem train bridge jungle jeep safari western ghats'
  ),
  (
    'Ashwem & Morjim Turtle Nesting Coast', 'Goa', 'Goa', 15.6582, 73.7144, 'nature',
    'Wide, tranquil North Goa beach noted for protected Olive Ridley sea turtle nesting dunes, trendy boutique shacks, and calm surf.',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Goa-Forests', 0.89, 'ashwem morjim turtle beach olive ridley quiet beach north goa boutique surf'
  ),
  (
    'Thalassa Greek Taverna', 'Goa', 'Goa', 15.6179, 73.7485, 'food',
    'Cliffside open-air Mediterranean restaurant in Siolim/Vagator acclaimed for flame dances, Greek souvlaki, and panoramic river sunsets.',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.96, 'thalassa greek taverna siolim vagator sunset dining cocktails fire dance'
  ),
  (
    'Tito’s Lane & Baga Beachfront', 'Goa', 'Goa', 15.5562, 73.7517, 'nightlife',
    'Goa’s highest-energy nightlife boulevard featuring clubs like Mambo’s and Tito’s alongside neon beach candlelit seafood shacks.',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Goa-Beaches', 0.92, 'titos lane baga beach clubbing mambos nightlife party shacks north goa'
  ),
  (
    'Agonda Beach Pristine Stretch', 'Goa', 'Goa', 15.0445, 73.9877, 'nature',
    'Serene 3 km unspoiled sand strip in South Goa devoid of jet skis and hawkers, ideal for meditation, swimming, and yoga retreats.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.90, 'agonda beach south goa quiet peaceful yoga retreat swimming dolphin'
  ),
  (
    'Cabo de Rama Fort & Cliff Overlook', 'Goa', 'Goa', 15.0886, 73.9219, 'viewpoint',
    'Medieval fortress steeped in Ramayana legend atop sheer cliff promontory gazing out over the confluence of the Sal River and ocean.',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/ASI-India', 0.88, 'cabo de rama fort south goa cliff sea view ramayana ruins canacona'
  ),
  (
    'Se Cathedral & Church of St. Cajetan', 'Goa', 'Goa', 15.5036, 73.9128, 'heritage',
    'One of the largest churches in Asia, built in Portuguese-Manueline style with the famed Golden Bell whose chime resonates across Old Goa.',
    'https://images.unsplash.com/photo-1548625361-195fe5787e98?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/ASI-India', 0.89, 'se cathedral old goa golden bell church st cajetan unesco portuguese'
  ),
  (
    'Martin’s Corner Seafood Restaurant', 'Goa', 'Goa', 15.3094, 73.9221, 'food',
    'Iconic rustic culinary institution in Betalbatim celebrated for Goan fish curry thali, crab rechado, butter garlic prawns, and live music.',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.93, 'martins corner betalbatim south goa fish curry crab thali seafood live band'
  ),
  (
    'Butterfly Beach Hidden Cove', 'Goa', 'Goa', 15.0227, 74.0041, 'nature',
    'Secluded amphitheater-shaped cove accessible solely via boat or jungle scramble from Palolem, frequented by playing dolphins.',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Goa-Tourism', 0.91, 'butterfly beach secret beach hidden cove boat dolphin palolem south goa'
  ),
  (
    'Arambol Sweet Water Lake & Banyan Tree', 'Goa', 'Goa', 15.6946, 73.7058, 'nature',
    'Freshwater sulfur lagoon tucked beside the sea with therapeutic clay mud baths and an enchanted banyan jungle meditation clearing.',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.92, 'arambol sweet water lake banyan tree mud bath hippie drum circle north goa'
  ),
  (
    'Artjuna Garden Cafe & Lifestyle Bazaar', 'Goa', 'Goa', 15.5802, 73.7461, 'food',
    'Serene mango-orchard courtyard cafe in Anjuna serving fresh organic hummus platters, specialty smoothies, and artisan boutique items.',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.87, 'artjuna cafe anjuna garden organic breakfast hummus lifestyle smoothie'
  ),
  (
    'Reis Magos Fort on Mandovi River', 'Goa', 'Goa', 15.4984, 73.8087, 'heritage',
    'Carefully restored 1551 defense citadel towering over the mouth of the Mandovi River, housing historical cannons and Mario Miranda art.',
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/ASI-India', 0.86, 'reis magos fort mandovi river panaji view mario miranda cannons heritage'
  ),

  -- 3. RISHIKESH (12 places)
  (
    'Triveni Ghat Evening Maha Aarti', 'Rishikesh', 'Uttarakhand', 30.1039, 78.2934, 'spiritual',
    'Holiest bathing ghat in Rishikesh where holy rivers Ganga, Yamuna, and Saraswati converge, illuminated nightly by synchronized conch and fire aarti.',
    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Uttarakhand-Tourism', 0.98, 'triveni ghat maha aarti ganga sangam diya floating lamps spiritual rishikesh'
  ),
  (
    'Lakshman Jhula Suspension Bridge', 'Rishikesh', 'Uttarakhand', 30.1294, 78.3248, 'heritage',
    'Iconic 137m iron suspension footbridge across the turquoise Ganges, offering views of multi-tiered Tera Manzil temple and river rafts.',
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.97, 'lakshman jhula suspension bridge ganges river tera manzil rishikesh tapovan'
  ),
  (
    'Ram Jhula & Swarg Ashram', 'Rishikesh', 'Uttarakhand', 30.1197, 78.3128, 'spiritual',
    'Stately pedestrian suspension bridge connecting Sivananda Ashram with the historic meditation halls and Ayurvedic dispensaries of Swarg Ashram.',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Uttarakhand-Tourism', 0.94, 'ram jhula swarg ashram sivananda bridge ganges meditation ayurveda'
  ),
  (
    'The Beatles Ashram (Chaurasi Kutia)', 'Rishikesh', 'Uttarakhand', 30.1132, 78.3138, 'culture',
    'Maharishi Mahesh Yogi’s meditation retreat inside Rajaji Tiger Reserve, where The Beatles composed the White Album amid graffiti meditation domes.',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Forest-Reserve-UK', 0.95, 'beatles ashram chaurasi kutia maharishi white album rajaji graffiti domes'
  ),
  (
    'Parmarth Niketan Ashram & Ganga Aarti', 'Rishikesh', 'Uttarakhand', 30.1172, 78.3146, 'spiritual',
    'World-renowned spiritual hub hosting the annual International Yoga Festival, featuring an impressive Shiva statue rising from the Ganga waters.',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Kaggle-Heritage', 0.93, 'parmarth niketan ganga aarti shiva statue yoga festival ashram swarg ashram'
  ),
  (
    'Neer Garh (Neer Gaddu) Waterfall', 'Rishikesh', 'Uttarakhand', 30.1428, 78.3371, 'nature',
    'Terraced jade-blue natural swimming pools hidden in lush sub-Himalayan jungle, reached via a 2 km stone trail from Badrinath highway.',
    'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.91, 'neer garh gaddu waterfall natural pool jungle trek badrinath road swim'
  ),
  (
    'Shivpuri White Water Rafting Rapids', 'Rishikesh', 'Uttarakhand', 30.1378, 78.3883, 'adventure',
    'Global epicentre for whitewater river rafting, featuring thrilling Grade III & IV rapids including Roller Coaster, Golf Course, and Club House.',
    'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Adventure-Sports', 0.96, 'shivpuri rafting rapids roller coaster golf course ganga cliff jumping adventure'
  ),
  (
    'Little Buddha Cafe & Rooftop', 'Rishikesh', 'Uttarakhand', 30.1311, 78.3262, 'food',
    'Beloved treehouse-style bamboo restaurant in Tapovan overlooking the turquoise Ganga, renowned for Israeli mezze, thalis, and momos.',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.92, 'little buddha cafe tapovan bamboo rooftop river view mezze vegan momos'
  ),
  (
    'Kunjapuri Devi Sunrise Temple Trek', 'Rishikesh', 'Uttarakhand', 30.1633, 78.3229, 'viewpoint',
    'High Shakti Peeth shrine perched at 1,665m offering sunrise panoramas across snow-capped peaks of Chaukhamba, Bandarpunch, and the Doon valley.',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Kaggle-Heritage', 0.93, 'kunjapuri devi sunrise temple shakti peeth chaukhamba snow peaks trek'
  ),
  (
    'The 60’s Beatles Cafe (Cafe Delmar)', 'Rishikesh', 'Uttarakhand', 30.1328, 78.3274, 'food',
    'Vintage record-clad cafe in Paidal Marg serving raw desserts, artisan pasta, and fresh ginger lemon tea with uninterrupted river vistas.',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.88, 'beatles cafe 60s cafe delmar vegan pasta desserts river view tapovan'
  ),
  (
    'Vashistha Cave (Vashistha Gufa)', 'Rishikesh', 'Uttarakhand', 30.1581, 78.4312, 'spiritual',
    'Ancient subterranean natural cave along the Ganga where Sage Vashistha meditated, imbued with profound silence and peace.',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Uttarakhand-Tourism', 0.86, 'vashistha gufa cave meditation silence sage shivpuri ganga riverbank'
  ),
  (
    'Patna Waterfall & Natural Limestone Caves', 'Rishikesh', 'Uttarakhand', 30.1345, 78.3582, 'nature',
    'Secluded 5 km hike past Garhwal villages to a limestone waterfall surrounded by shallow stalactite caves and wild mountain orchids.',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.85, 'patna waterfall limestone caves trek garhwal village jungle stream'
  ),

  -- 4. KASOL / PARVATI VALLEY (10 places)
  (
    'Chalal Trek & Suspension Bridge Trail', 'Kasol', 'Himachal Pradesh', 32.0135, 77.3195, 'nature',
    'Picturesque pine trail winding along the roaring Parvati River across a cable suspension bridge, leading to the bohemian hamlet of Chalal.',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Parvati-Valley', 0.94, 'chalal trek bridge parvati river pine forest riverside walk kasol'
  ),
  (
    'Manikaran Sahib Gurudwara & Hot Springs', 'Kasol', 'Himachal Pradesh', 32.0272, 77.3486, 'spiritual',
    'Venerated Sikh and Hindu pilgrimage sanctuary set between towering canyon walls, renowned for boiling geothermal pools that cook community langar.',
    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Kaggle-Heritage', 0.97, 'manikaran sahib gurudwara hot springs sulfur bath langar parvati canyon'
  ),
  (
    'Kheerganga Trek & Natural Sulfur Pool (2,960m)', 'Kasol', 'Himachal Pradesh', 31.9897, 77.5111, 'adventure',
    'Iconic 12 km alpine trek traversing waterfalls, oak forests, and apple orchards to reach an open-air hot spring surrounded by snow-capped peaks.',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/Incredible-India', 0.98, 'kheerganga khirganga trek hot spring sulfur bath alpine camp parvati trek'
  ),
  (
    'Tosh Village & Glacier Mountain Viewpoint', 'Kasol', 'Himachal Pradesh', 32.0152, 77.4528, 'culture',
    'Traditional wooden mountain village nestled at 2,400m at the terminus of Parvati Valley, boasting front-row views of Tosh glacier peaks.',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Parvati-Valley', 0.95, 'tosh village tosh glacier snow peak viewpoint parvati valley wooden houses'
  ),
  (
    'Grahan Village Wilderness Trek', 'Kasol', 'Himachal Pradesh', 31.9774, 77.2917, 'nature',
    'Offbeat 9 km trek following the Grahan nullah through thick deodar forest to an ancient, alcohol-free Kanashi-speaking village.',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Trek-Database', 0.88, 'grahan village wilderness trek nullah honey wood houses offbeat kasol'
  ),
  (
    'Moon Dance Cafe & German Bakery', 'Kasol', 'Himachal Pradesh', 32.0101, 77.3148, 'food',
    'Historic culinary pioneer in the heart of Kasol, famous for fresh cinnamon rolls, apple crumble, shakshuka, and wood-fired pizzas.',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.91, 'moon dance cafe german bakery cinnamon roll apple crumble kasol market food'
  ),
  (
    'The Evergreen Cafe & Garden Courtyard', 'Kasol', 'Himachal Pradesh', 32.0089, 77.3162, 'food',
    'Sprawling garden cafe loved by global travelers for authentic Israeli schnitzel, falafel platters, pasta, and ambient psy-chill playlists.',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.90, 'evergreen cafe kasol garden israeli falafel schnitzel pizza chillout'
  ),
  (
    'Malana Ancient Republic Village Trek', 'Kasol', 'Himachal Pradesh', 32.0583, 77.2639, 'culture',
    'One of the world’s oldest democracies, shrouded in ancient customs tracing lineage to Alexander the Great’s soldiers under the shadow of Deo Tibba.',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    'Wikipedia/Kaggle-Heritage', 0.93, 'malana village ancient republic alexander greek lineage kanashi deo tibba'
  ),
  (
    'Jim Morrison Cafe Hillside Hideout', 'Kasol', 'Himachal Pradesh', 32.0122, 77.3184, 'food',
    'Atmospheric vegetarian cafe perched up the wooded hillside of Old Kasol with floor seating, classic rock vinyls, and homemade waffles.',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    'Kaggle-Culinary-India', 0.89, 'jim morrison cafe hillside waffles floor seating classic rock old kasol'
  ),
  (
    'Choojh (Chuj) Riverside Meadow & Hamlet', 'Kasol', 'Himachal Pradesh', 32.0118, 77.3245, 'nature',
    'Serene apple orchard meadow located right across the river from Kasol, offering peaceful riverside camping, boulder lounging, and starry skies.',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'data.gov.in/HP-Forests', 0.86, 'choojh chuj meadow riverside camping apple orchard parvati peaceful'
  )
on conflict do nothing;
