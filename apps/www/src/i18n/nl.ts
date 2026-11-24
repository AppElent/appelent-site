import type { Messages } from './en.ts'

// De Nederlandse catalogus. Zelfde sleutels als en.ts (de parity-test bewaakt
// dat).

export const nl = {
  meta: {
    siteName: 'AppElent',
    homeTitle: 'AppElent · Apps voor thuis, sport en spel',
    homeDescription:
      'AppElent maakt apps voor thuis, sport en spel: Gather, Foundry, Fairway en Arcade Club.',
    privacyTitle: 'Privacybeleid · AppElent',
    privacyDescription:
      'Eén privacybeleid voor Gather, Foundry, Fairway, Arcade Club en appelent.nl.',
    supportTitle: 'Support · AppElent',
    supportDescription:
      'Hulp bij Gather, Foundry, Fairway en Arcade Club: mail ons of lees de antwoorden op veelgestelde vragen.',
    notFoundTitle: 'Pagina niet gevonden · AppElent',
    ogLocale: 'nl_NL',
  },
  shell: {
    skip: 'Naar de inhoud',
    homeLabel: 'AppElent, homepage',
    navLabel: 'Hoofdmenu',
    navApps: 'Apps',
    navPrivacy: 'Privacy',
    navSupport: 'Support',
    langLabel: 'Taal',
    languages: { nl: 'NL', en: 'EN' },
    languageNames: { nl: 'Nederlands', en: 'English' },
    footTag: 'Apps voor thuis, sport en spel.',
    footApps: 'Apps',
    footAppElent: 'AppElent',
    footContact: 'Contact',
    footAccount: 'Account',
    footStatus: 'Status',
    copyright: '© 2026 AppElent',
  },
  home: {
    hero: {
      eyebrow: 'AppElent',
      title: 'Apps voor thuis, sport en spel.',
      body: 'Vier apps voor het huishouden, de sportschool, de golfbaan en spelavonden. Op het web en op de iPhone, met één account.',
      cta: 'Bekijk de apps',
      contact: 'Neem contact op',
    },
    apps: {
      title: 'De apps',
      body: 'Vier apps, elk voor één deel van het leven. Je logt overal in met hetzelfde account.',
      storeAlt: 'Download {app} in de App Store',
      soonSmall: 'App Store',
      soon: 'Binnenkort',
      openWeb: 'Open web-app',
    },
    account: {
      title: 'Eén account voor alle apps',
      body: 'Bekijk welke apps je gebruikt, download je gegevens of verwijder je account, op één plek.',
      cta: 'Naar je account',
    },
    stack: {
      title: 'Waarmee we bouwen',
      body: 'Web en iPhone uit één codebase per app, gebouwd met AI-agents.',
    },
    contact: {
      title: 'Contact',
      body: 'Een vraag of een idee? Mail ons of kijk op GitHub.',
      mail: 'Mail ons',
      github: 'GitHub',
    },
  },
  apps: {
    gather: {
      kind: 'Huishouden',
      body: 'Het huishouden samen: recepten, weekmenu, boodschappen en taken, gedeeld met je huisgenoten.',
      features: {
        recipes: 'Recepten bewaren of importeren via een webadres',
        meals:
          'Een weekmenu plannen en de ingrediënten in één keer op de boodschappenlijst zetten',
        groceries: 'Boodschappenlijsten per winkel, die je samen afvinkt',
        home: 'Taken, notities en een gedeelde agenda voor het hele huis',
      },
      stores:
        'Groepen en hun leden, recepten (ook die je via een webadres importeert), weekmenu’s, boodschappen- en voorraadlijsten, taken, notities, agenda’s en afspraken, een babylogboek, huishoudfinanciën, proefnotities en foto’s.',
      notes: {
        group:
          'Wat je aan een groep toevoegt, is zichtbaar voor alle leden van die groep. Leden zien elkaars naam, niet elkaars e-mailadres. Foto’s openen via een lange, onraadbare link waarvoor je niet hoeft in te loggen.',
        health:
          'Het babylogboek bevat gezondheidsgegevens over een kind. We verwerken die op basis van uitdrukkelijke toestemming, die je geeft door ze in te voeren; alleen een ouder of voogd hoort ze in te voeren. Verwijder ze om je toestemming in te trekken.',
        integrations:
          'Koppelt een lid Notion of Todoist, dan bewaren we een toegangstoken voor die dienst, zodat Gather de gekoppelde lijst kan lezen en bijwerken. Importeer je een recept, dan haalt onze server de pagina op; de website ziet onze server, niet jou.',
      },
    },
    foundry: {
      kind: 'Training',
      body: 'Krachttraining en voeding bijhouden: sessies, schema’s, 1RM, hardlopen en fietsen.',
      features: {
        strength: 'Krachttraining per set loggen, met schema’s en je 1RM',
        endurance: 'WOD’s, hardloop- en fietsritten in hetzelfde overzicht',
        nutrition:
          'Een voedingsdagboek met doelen en je eigen producten en recepten',
        progress: 'Je voortgang per oefening en een overzicht van je week',
      },
      stores:
        'Trainingen en sets, schema’s, WOD’s, 1RM en persoonlijke records, hardloop- en fietsritten, voedingsdagboek, voedingsdoelen, lichaamsmetingen en foto’s.',
      notes: {
        health:
          'Voedings- en lichaamsgegevens kunnen gezondheidsgegevens zijn. We verwerken ze op basis van uitdrukkelijke toestemming, die je geeft door ze vast te leggen; verwijder ze om je toestemming in te trekken.',
        shared:
          'Bij een gedeelde training zijn je weergavenaam en resultaten zichtbaar voor de organisator en de andere deelnemers.',
      },
    },
    fairway: {
      kind: 'Golf',
      body: 'Je golfronde op de baan: scores per hole, statistieken en je eigen banen.',
      features: {
        score: 'Per hole je score, putts, fairways en greens bijhouden',
        distances: 'Afstanden tot de green via de gps van je telefoon',
        stats: 'Statistieken en clubafstanden over al je rondes',
        courses: 'Banen opzoeken en correcties insturen',
      },
      stores:
        'Rondes met scores per hole, putts, fairways en greens, je handicap, thuisbaan en clubs, banen die je bewerkt, gastspelers die je toevoegt en correcties op banen die je instuurt.',
      notes: {
        location:
          'Markeer je een slag, dan bewaren we de gps-positie bij die ronde om je clubafstanden te berekenen. Andere afstanden berekent je telefoon zelf; je locatie wordt niet bewaard of naar ons gestuurd. Met gps op het vergrendelscherm ontvangt Fairway je locatie op de achtergrond alleen zolang er een ronde open staat op het Speel-scherm.',
      },
    },
    arcade: {
      kind: 'Spellen',
      body: 'Spellen met vrienden, aan tafel of op afstand: quiz, kaart- en dobbelspellen en schaak.',
      features: {
        quiz: 'Quiz- en woordspellen voor de hele groep',
        cards: 'Kaartspellen zoals toepen en pesten',
        dice: 'Dobbelspellen zoals mexen en blufpoker',
        join: 'Meedoen met een QR-code; gasten hebben geen account nodig',
      },
      stores:
        'Je spelersnaam, de kamers en spellen die je host of waar je aan meedoet, en je zetten en scores.',
      notes: {
        guests:
          'Gasten spelen zonder account, met een willekeurige code die op hun apparaat wordt gemaakt en de naam die ze invullen. Solospellen, opgeslagen puzzels en instellingen blijven op je apparaat.',
        history:
          'Afgelopen spellen blijven bestaan, zodat andere spelers hun geschiedenis houden; verwijder je je account, dan halen we je naam uit die spellen.',
        camera:
          'De iOS-app gebruikt de camera alleen om de QR-code van een uitnodiging te scannen. Beelden worden op je apparaat verwerkt en nooit opgeslagen of verstuurd.',
      },
    },
  },
  privacy: {
    title: 'Privacybeleid',
    lead: 'Eén privacybeleid voor alle apps: welke gegevens we bewaren, waarom, en hoe je ze inziet of verwijdert.',
    scope: 'Gather · Foundry · Fairway · Arcade Club · appelent.nl',
    updated: 'Bijgewerkt op 24 november 2026',
    tocLabel: 'Inhoud',
    sections: {
      who: {
        anchor: 'wie',
        title: 'Wie we zijn',
        body: {
          who: 'AppElent is de naam waaronder Eric Jansen apps maakt. AppElent is verantwoordelijk voor de persoonsgegevens die hier staan beschreven. Dit beleid geldt voor Gather, Foundry, Fairway, Arcade Club en deze website, appelent.nl.',
          contact: 'Vragen over dit beleid of je gegevens: mail {email}.',
        },
      },
      account: {
        anchor: 'account',
        title: 'Je account',
        body: {
          shared:
            'Alle apps delen één inlog. Daarvoor bewaren we je naam, je e-mailadres, een profielfoto als je die toevoegt, en de manier waarop je inlogt: een wachtwoord (versleuteld opgeslagen door onze inlogdienst) of Apple, Google of Microsoft, die dan je naam en e-mailadres met ons delen.',
          purpose:
            'We gebruiken je account om je in te loggen en te bewaren wat je in elke app opslaat. Dat is nodig om je de apps te kunnen leveren.',
        },
      },
      perApp: {
        anchor: 'per-app',
        title: 'Wat elke app bewaart',
        body: {
          intro:
            'Elke app bewaart alleen wat je er zelf in zet, om het je te tonen en tussen je apparaten gelijk te houden. Per app:',
        },
        outro: {
          site: 'Deze website bewaart geen accountgegevens. Hij zet één cookie, lang, die je taal een jaar onthoudt. Cloudflare, dat de site host, verwerkt je IP-adres om de site te leveren en te beschermen.',
          device:
            'Voorkeuren zoals taal en weergave, en caches, blijven op je apparaat.',
        },
      },
      services: {
        anchor: 'diensten',
        title: 'Diensten die we gebruiken',
        body: {
          intro:
            'Deze dienstverleners verwerken gegevens namens ons, alleen om de apps te laten werken:',
        },
        items: {
          clerk: 'Clerk: inloggen en accountbeheer (VS).',
          convex:
            'Convex: database en bestandsopslag, gehost in de EU (Ierland).',
          cloudflare: 'Cloudflare: hosting van de websites en web-apps.',
          sentry:
            'Sentry: crash- en foutrapporten (VS). Een rapport bevat technische gegevens zoals de fout, de pagina, het apparaat en de appversie, nooit je e-mailadres, je naam of wat je invoert. Rapporten van een website kunnen de interne ID van je account bevatten. De telefoon-app van Foundry neemt een kleine steekproef van sessies op, met alle tekst en afbeeldingen afgeschermd.',
          expo: 'Expo: het bouwen van de telefoon-apps en het leveren van hun updates.',
          anthropic:
            'Anthropic: hulp met AI, alleen als je erom vraagt. Gather stuurt de tekst van een receptpagina die het niet kan lezen, of de ingrediënten van een recept om de voedingswaarde te schatten; Foundry stuurt je maaltijdtekst of foto’s om voedingsmiddelen te herkennen. Er gaat nooit je naam of e-mailadres mee, en Anthropic gebruikt het niet om modellen te trainen.',
          github:
            'GitHub: probleemmeldingen uit de web-app van Gather worden issues in de openbare coderepository. Zet geen persoonlijke gegevens in een melding.',
          googleFonts:
            'Google Fonts: de web-app van Gather laadt zijn lettertypen bij Google, dat je IP-adres ontvangt als een pagina laadt.',
        },
        outro: {
          others:
            'Sommige functies benaderen een andere dienst, met een eigen privacybeleid: Apple Maps voor de holekaarten in Fairway, Open Food Facts als je in Foundry een voedingsmiddel scant of zoekt, Spotify als Muziektijdlijn in Arcade Club een nummer opzoekt, en Notion of Todoist als een lid in Gather die koppelt. Baangegevens komen van OpenStreetMap; daar gaat niets over jou heen.',
          transfers:
            'Doorgifte buiten de Europese Economische Ruimte gebeurt met passende waarborgen, zoals het EU-VS-gegevensprivacykader of de standaardcontractbepalingen van de Europese Commissie.',
          noAds:
            'We verkopen je gegevens niet, tonen geen advertenties, gebruiken je gegevens niet voor marketing of profilering en volgen je niet in andere apps en websites.',
        },
      },
      rights: {
        anchor: 'rechten',
        title: 'Inzien en verwijderen',
        body: {
          delete:
            'In elke app kies je onder Account of je alleen de gegevens van die app verwijdert of je hele AppElent-account, waarmee je inlog en je gegevens in alle apps verdwijnen. Straks kan dat ook op account.appelent.nl. Verwijderen in een app gebeurt direct; een verzoek per e-mail handelen we binnen 30 dagen af.',
          groups:
            'In Gather verdwijnen groepen waarvan jij het enige lid bent, met alles erin. Wat je aan een gedeelde groep toevoegde, blijft bij die groep, omdat het van het huishouden is.',
          retention:
            'We bewaren je gegevens zolang je een account hebt. Fout- en probleemmeldingen worden binnen 90 dagen verwijderd; een melding op GitHub blijft staan tot hij wordt verwijderd, en op verzoek verwijderen we de jouwe.',
          rights:
            'Je hebt het recht je gegevens in te zien, te corrigeren, te verwijderen of te exporteren, de verwerking te beperken of er bezwaar tegen te maken, en je toestemming in te trekken. In Gather en Foundry exporteer je je gegevens zelf. Voor elk ander verzoek mail je {email}; we reageren binnen een maand.',
          complaint:
            'Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens of bij de toezichthouder in je eigen land.',
          security:
            'Gegevens gaan via versleutelde verbindingen, en alleen jij, of de leden van je groep, kunnen erbij nadat je bent ingelogd.',
          children:
            'De apps zijn niet bedoeld voor kinderen jonger dan 16 jaar.',
        },
      },
      contact: {
        anchor: 'contact',
        title: 'Contact',
        body: {
          email:
            'Vragen over je gegevens? Mail {email}. Als we dit beleid wijzigen, passen we de datum bovenaan aan.',
        },
      },
    },
  },
  support: {
    title: 'Support',
    lead: 'Loop je ergens tegenaan of heb je een idee? Laat het weten.',
    mailTitle: 'Mail ons',
    mailBody: 'Noem de app, je toestel en wat je deed. Een screenshot helpt.',
    statusBody: 'Werkt een app niet? Kijk of er een storing is op de',
    statusLink: 'statuspagina',
    faqTitle: 'Veelgestelde vragen',
    faq: {
      delete: {
        q: 'Hoe verwijder ik mijn account?',
        a: 'In elke app onder Account, Account verwijderen. Je kiest daar of je alleen de gegevens van die app wist of je hele AppElent-account.',
      },
      account: {
        q: 'Werkt één account in alle apps?',
        a: 'Ja. Je logt in met hetzelfde account in Gather, Foundry, Fairway en Arcade Club.',
      },
      android: {
        q: 'Zijn de apps er ook voor Android?',
        a: 'Nog niet. De apps zijn er voor iPhone en in de browser.',
      },
    },
  },
  notFound: {
    eyebrow: '404',
    title: 'Deze pagina bestaat niet.',
    body: 'De link is oud of er zit een typfout in. Op de homepage vind je alle apps.',
    cta: 'Naar de homepage',
  },
} satisfies Messages
