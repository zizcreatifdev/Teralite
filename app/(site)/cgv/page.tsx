import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente | Teralite',
  description: 'Consultez les conditions générales de vente de Teralite — éclairage LED professionnel au Sénégal.',
}

export default function CGVPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-blue-teralite mb-2">
        Conditions Générales de Vente
      </h1>
      <p className="text-xs text-text-light mb-8">Dernière mise à jour : avril 2026</p>

      <div className="space-y-8 text-sm text-text-mid leading-relaxed">
        {[
          {
            titre: '1. Objet',
            contenu: `Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre Teralite, entreprise de droit sénégalais spécialisée dans l'éclairage LED, et ses clients, personnes physiques ou morales. Toute commande passée sur le site teralite.sn implique l'acceptation sans réserve des présentes CGV.`,
          },
          {
            titre: '2. Produits',
            contenu: `Teralite commercialise des solutions d'éclairage LED : ampoules, plafonniers, luminaires extérieurs, éclairage solaire et industriel. Les caractéristiques essentielles des produits sont présentées sur chaque fiche produit du site. Les photos sont non contractuelles et peuvent présenter de légères variations par rapport au produit livré.`,
          },
          {
            titre: '3. Prix',
            contenu: `Les prix sont indiqués en Francs CFA (FCFA), toutes taxes comprises. Teralite se réserve le droit de modifier ses prix à tout moment. Les prix applicables sont ceux en vigueur au moment de la validation de la commande. Les frais de livraison sont indiqués séparément avant validation.`,
          },
          {
            titre: '4. Commande',
            contenu: `La commande est confirmée après validation du paiement (pour les paiements mobiles) ou à la confirmation par l'équipe Teralite (pour le paiement à la livraison). Un email et/ou SMS de confirmation est envoyé au client. Teralite se réserve le droit d'annuler toute commande en cas de stock épuisé, d'erreur de prix manifeste ou de suspicion de fraude.`,
          },
          {
            titre: '5. Paiement',
            contenu: `Nous acceptons les modes de paiement suivants :\n- Orange Money\n- Wave\n- YAS\n- Cash à la livraison\n\nLes paiements mobiles sont traités via PayDunya. Le paiement est sécurisé et aucune donnée bancaire n'est stockée sur nos serveurs.`,
          },
          {
            titre: '6. Livraison',
            contenu: `Les délais de livraison indicatifs sont :\n- Dakar Centre : 24 à 48 heures\n- Grand Dakar : 2 à 3 jours ouvrés\n- Autres régions du Sénégal : 3 à 5 jours ouvrés\n\nCes délais courent à compter de la confirmation du paiement. En cas de retard, le client sera informé par SMS ou WhatsApp.`,
          },
          {
            titre: '7. Retours et échanges',
            contenu: `Le client dispose d'un délai de 7 jours à compter de la réception pour signaler tout produit défectueux ou non conforme à la commande. Le retour doit être effectué dans l'emballage d'origine. Teralite procédera à un échange ou un remboursement selon les disponibilités. Les retours pour convenance personnelle ne sont pas acceptés.`,
          },
          {
            titre: '8. Garantie',
            contenu: `Tous nos produits bénéficient d'une garantie légale de conformité. En cas de défaut avéré dans les conditions normales d'utilisation, Teralite procédera au remplacement du produit. La garantie ne couvre pas les dommages résultant d'une mauvaise installation, d'une utilisation inappropriée ou de surtensions électriques.`,
          },
          {
            titre: '9. Propriété intellectuelle',
            contenu: `Tout le contenu du site teralite.sn (textes, images, logos, design) est protégé par le droit d'auteur et appartient à Teralite ou à ses partenaires. Toute reproduction sans autorisation préalable est interdite.`,
          },
          {
            titre: '10. Données personnelles',
            contenu: `Teralite collecte et traite les données personnelles des clients uniquement pour les besoins de la commande et de la relation client. Ces données ne sont pas cédées à des tiers. Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.`,
          },
          {
            titre: '11. Litiges',
            contenu: `En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux compétents de Dakar (Sénégal) seront saisis. La loi sénégalaise est applicable.`,
          },
        ].map((section) => (
          <div key={section.titre}>
            <h2 className="text-base font-semibold text-text-main mb-3">{section.titre}</h2>
            <div className="whitespace-pre-line">{section.contenu}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
