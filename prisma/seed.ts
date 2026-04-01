import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed...')

  // Créer le compte Super Admin
  const motDePasseHash = await bcrypt.hash('Teralite2025!', 12)

  const superAdmin = await prisma.utilisateur.upsert({
    where: { email: 'admin@teralite.sn' },
    update: {},
    create: {
      nom: 'Admin Teralite',
      email: 'admin@teralite.sn',
      motDePasse: motDePasseHash,
      role: Role.SUPER_ADMIN,
      actif: true,
    },
  })

  console.log(`✅ Super Admin créé : ${superAdmin.email}`)

  // Paramètres de base du site
  const parametres = [
    { cle: 'site_nom', valeur: 'Teralite', description: 'Nom du site' },
    { cle: 'site_email', valeur: 'contact@teralite.sn', description: 'Email de contact' },
    { cle: 'site_telephone', valeur: '+221 XX XXX XX XX', description: 'Téléphone principal' },
    { cle: 'paydunya_mode', valeur: 'test', description: 'Mode PayDunya (test/production)' },
    { cle: 'tva_taux', valeur: '0.18', description: 'Taux de TVA par défaut (18%)' },
    { cle: 'devise', valeur: 'FCFA', description: 'Devise' },
    { cle: 'commande_numero_courant', valeur: '0', description: 'Compteur commandes' },
    { cle: 'devis_numero_courant', valeur: '0', description: 'Compteur devis' },
    { cle: 'facture_numero_courant', valeur: '0', description: 'Compteur factures' },
  ]

  for (const param of parametres) {
    await prisma.parametres.upsert({
      where: { cle: param.cle },
      update: {},
      create: param,
    })
  }

  console.log(`✅ ${parametres.length} paramètres créés`)

  // Zones de livraison par défaut
  const zones = [
    { nom: 'Dakar Centre', tarif: 1500, delaiJours: 1 },
    { nom: 'Dakar Banlieue', tarif: 2000, delaiJours: 2 },
    { nom: 'Région de Dakar', tarif: 3000, delaiJours: 3 },
    { nom: 'Autres régions', tarif: 5000, delaiJours: 5 },
  ]

  for (const zone of zones) {
    const existante = await prisma.zoneLivraison.findFirst({
      where: { nom: zone.nom },
    })
    if (!existante) {
      await prisma.zoneLivraison.create({ data: zone })
    }
  }

  console.log(`✅ ${zones.length} zones de livraison créées`)

  // Configuration des commissions par défaut
  const configComm = await prisma.configCommission.findFirst({ where: { actif: true } })
  if (!configComm) {
    await prisma.configCommission.create({
      data: {
        taux: 5, // 5% par défaut
        actif: true,
      },
    })
    console.log('✅ Configuration commission créée (5%)')
  }

  console.log('🎉 Seed terminé avec succès!')
  console.log('')
  console.log('  Accès admin :')
  console.log('  Email    : admin@teralite.sn')
  console.log('  Password : Teralite2025!')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
