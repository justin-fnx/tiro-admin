import { PrismaClient, AdminRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL

  if (!initialAdminEmail) {
    console.log('INITIAL_ADMIN_EMAIL not set, skipping admin seed')
    return
  }

  // 초기 SUPER_ADMIN 생성
  const admin = await prisma.adminWhitelist.upsert({
    where: { email: initialAdminEmail },
    update: {},
    create: {
      email: initialAdminEmail,
      name: 'Super Admin',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  })

  console.log(`Created/Updated admin: ${admin.email}`)

  // 기본 시스템 설정
  const defaultSettings = [
    {
      key: 'default_daily_credit',
      value: { amount: 1000 },
      description: '신규 사용자 일일 무료 크레딧',
    },
    {
      key: 'default_weekly_credit',
      value: { amount: 5000 },
      description: '신규 사용자 주간 무료 크레딧',
    },
    {
      key: 'max_projects_per_user',
      value: { free: 3, basic: 10, pro: 50, enterprise: -1 },
      description: '플랜별 최대 프로젝트 수 (-1은 무제한)',
    },
  ]

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        updatedBy: initialAdminEmail,
      },
    })
    console.log(`Created/Updated setting: ${setting.key}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
