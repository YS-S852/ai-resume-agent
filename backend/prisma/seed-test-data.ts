import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 2;

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`User with id=${userId} not found. Aborting.`);
    return;
  }
  console.log(`Found user: ${user.username} (${user.email})`);

  // 1. Profile
  const existingProfile = await prisma.profile.findUnique({ where: { userId } });
  if (existingProfile) {
    await prisma.profile.update({
      where: { userId },
      data: {
        fullName: '张明远',
        phone: '138-0000-1234',
        email: 'mingyuan@example.com',
        city: '北京',
        jobTitle: '高级前端工程师',
        jobIntention: '在职-看机会',
        summary: '拥有6年前端开发经验，精通React生态与TypeScript，擅长复杂业务系统的架构设计与性能优化。在字节跳动和阿里巴巴主导过多个千万级用户产品的前端重构，具备跨团队协作和技术团队管理能力。',
      },
    });
    console.log('Profile updated.');
  } else {
    await prisma.profile.create({
      data: {
        userId,
        fullName: '张明远',
        phone: '138-0000-1234',
        email: 'mingyuan@example.com',
        city: '北京',
        jobTitle: '高级前端工程师',
        jobIntention: '在职-看机会',
        summary: '拥有6年前端开发经验，精通React生态与TypeScript，擅长复杂业务系统的架构设计与性能优化。在字节跳动和阿里巴巴主导过多个千万级用户产品的前端重构，具备跨团队协作和技术团队管理能力。',
      },
    });
    console.log('Profile created.');
  }

  // 2. Education (2 records)
  await prisma.education.createMany({
    data: [
      {
        userId,
        school: '北京大学',
        major: '计算机科学与技术',
        degree: '硕士',
        startDate: '2016-09',
        endDate: '2019-06',
        gpa: '3.8',
        honors: '优秀毕业生、国家奖学金',
      },
      {
        userId,
        school: '武汉大学',
        major: '软件工程',
        degree: '学士',
        startDate: '2012-09',
        endDate: '2016-06',
        gpa: '3.6',
        honors: '校级一等奖学金',
      },
    ],
    skipDuplicates: true,
  });
  console.log('Education records created.');

  // 3. WorkExperience (2 records)
  await prisma.workExperience.createMany({
    data: [
      {
        userId,
        company: '字节跳动',
        industry: '互联网',
        position: '高级前端工程师',
        startDate: '2022-03',
        endDate: null,
        responsibilities: '负责抖音创作者平台的前端架构设计与开发，主导微前端改造项目，提升团队开发效率30%',
        achievements: '完成创作者平台从单体应用到微前端架构的全面迁移，页面加载速度提升40%，获得公司技术突破奖',
        teamSize: 8,
      },
      {
        userId,
        company: '阿里巴巴',
        industry: '互联网',
        position: '前端工程师',
        startDate: '2019-07',
        endDate: '2022-02',
        responsibilities: '负责天猫营销活动页面的开发与性能优化，参与淘系前端基础设施建设',
        achievements: '主导天猫双11活动页性能优化项目，FCP降低60%，参与开发前端监控SDK并推广至全集团',
        teamSize: 5,
      },
    ],
    skipDuplicates: true,
  });
  console.log('WorkExperience records created.');

  // 4. Project (2 records)
  await prisma.project.createMany({
    data: [
      {
        userId,
        name: 'CloudDoc在线协作平台',
        startDate: '2022-06',
        endDate: '2023-12',
        techStack: 'React,TypeScript,CRDT,WebSocket',
        background: '字节跳动内部文档协作系统，支持多人实时编辑与评论',
        responsibilities: '主导前端架构设计，实现基于CRDT算法的实时协同编辑引擎',
        contributions: '设计并实现了冲突解决算法，支持万人级并发编辑',
        results: '平台日均活跃用户5万+，编辑延迟<50ms，获得内部创新项目一等奖',
      },
      {
        userId,
        name: 'DataViz可视化引擎',
        startDate: '2020-03',
        endDate: '2021-08',
        techStack: 'Vue 3,D3.js,WebGL,Canvas',
        background: '天猫数据大屏可视化项目，支持实时数据展示与交互分析',
        responsibilities: '负责可视化引擎核心模块开发，实现高性能Canvas/WebGL渲染层',
        contributions: '开发了基于WebGL的粒子渲染系统，支持10万级数据点流畅渲染',
        results: '双11实时大屏稳定运行，渲染帧率>60fps，被推广至集团10+业务线',
      },
    ],
    skipDuplicates: true,
  });
  console.log('Project records created.');

  // 5. Skill (multiple records, each skill as a separate row)
  const skills = [
    // 前端框架
    { userId, category: '前端框架', name: 'React', level: '精通' },
    { userId, category: '前端框架', name: 'Vue 3', level: '熟练' },
    { userId, category: '前端框架', name: 'Next.js', level: '熟练' },
    // 语言
    { userId, category: '语言', name: 'TypeScript', level: '精通' },
    { userId, category: '语言', name: 'JavaScript', level: '精通' },
    { userId, category: '语言', name: 'HTML5', level: '精通' },
    { userId, category: '语言', name: 'CSS3', level: '精通' },
    // 工程化
    { userId, category: '工程化', name: 'Webpack', level: '熟练' },
    { userId, category: '工程化', name: 'Vite', level: '熟练' },
    { userId, category: '工程化', name: 'Docker', level: '了解' },
  ];
  await prisma.skill.createMany({
    data: skills,
    skipDuplicates: true,
  });
  console.log('Skill records created.');

  // 6. Resume (3 records)
  await prisma.resume.createMany({
    data: [
      {
        userId,
        title: '前端工程师简历',
        template: 'minimal',
        language: 'zh',
        content: {
          sections: ['profile', 'education', 'workExperience', 'project', 'skill'],
          layout: 'single-column',
        },
      },
      {
        userId,
        title: '全栈开发简历',
        template: 'classic',
        language: 'zh',
        content: {
          sections: ['profile', 'education', 'workExperience', 'project', 'skill'],
          layout: 'two-column',
        },
      },
      {
        userId,
        title: '实习申请简历',
        template: 'modern',
        language: 'zh',
        content: {
          sections: ['profile', 'education', 'skill'],
          layout: 'single-column',
        },
      },
    ],
    skipDuplicates: true,
  });
  console.log('Resume records created.');

  // 7. JobDescription (3 records)
  const jd1 = await prisma.jobDescription.create({
    data: {
      userId,
      title: '字节跳动高级前端工程师',
      company: '字节跳动',
      rawContent: '职位：高级前端工程师\n公司：字节跳动\n要求：5年以上前端开发经验，精通React和TypeScript，有大型项目架构设计经验\n职责：负责核心业务前端架构设计与开发，推动前端基础设施建设',
      parsedData: {
        position: '高级前端工程师',
        company: '字节跳动',
        requirements: ['5年以上前端开发经验', '精通React和TypeScript', '有大型项目架构设计经验'],
        responsibilities: ['负责核心业务前端架构设计与开发', '推动前端基础设施建设'],
      },
    },
  });
  const jd2 = await prisma.jobDescription.create({
    data: {
      userId,
      title: '阿里巴巴全栈工程师',
      company: '阿里巴巴',
      rawContent: '职位：全栈工程师\n公司：阿里巴巴\n要求：3年以上全栈开发经验，熟悉React/Vue和Node.js\n职责：负责前后端全链路开发，参与技术方案评审',
      parsedData: {
        position: '全栈工程师',
        company: '阿里巴巴',
        requirements: ['3年以上全栈开发经验', '熟悉React/Vue和Node.js'],
        responsibilities: ['负责前后端全链路开发', '参与技术方案评审'],
      },
    },
  });
  const jd3 = await prisma.jobDescription.create({
    data: {
      userId,
      title: '腾讯前端开发',
      company: '腾讯',
      rawContent: '职位：前端开发工程师\n公司：腾讯\n要求：2年以上前端经验，熟悉Vue或React\n职责：负责微信生态相关产品前端开发',
      parsedData: {
        position: '前端开发工程师',
        company: '腾讯',
        requirements: ['2年以上前端经验', '熟悉Vue或React'],
        responsibilities: ['负责微信生态相关产品前端开发'],
      },
    },
  });
  console.log('JobDescription records created.');

  // 8. AtsReport (2 records)
  // Need resume IDs first
  const resumes = await prisma.resume.findMany({ where: { userId } });
  const resume1Id = resumes.find((r) => r.title === '前端工程师简历')?.id;
  const resume2Id = resumes.find((r) => r.title === '全栈开发简历')?.id;

  await prisma.atsReport.createMany({
    data: [
      {
        userId,
        resumeId: resume1Id || null,
        jobDescriptionId: jd1.id,
        overallScore: 85,
        keywordScore: 82,
        skillMatchScore: 88,
        projectScore: 85,
        achievementScore: 80,
        formatScore: 90,
        details: {
          missingKeywords: ['微前端', 'SSR'],
          matchedSkills: ['React', 'TypeScript', 'Webpack'],
          suggestions: ['增加微前端相关经验描述', '补充SSR项目经验'],
        },
        suggestions: ['增加微前端相关经验描述', '补充SSR项目经验', '优化项目成果量化表述'],
      },
      {
        userId,
        resumeId: resume2Id || null,
        jobDescriptionId: jd2.id,
        overallScore: 92,
        keywordScore: 90,
        skillMatchScore: 95,
        projectScore: 88,
        achievementScore: 90,
        formatScore: 95,
        details: {
          missingKeywords: ['Node.js部署'],
          matchedSkills: ['React', 'Vue', 'TypeScript', 'Docker'],
          suggestions: ['补充Node.js后端经验'],
        },
        suggestions: ['补充Node.js后端经验', '增加全栈项目案例'],
      },
    ],
    skipDuplicates: true,
  });
  console.log('AtsReport records created.');

  // 9. InterviewRecord (1 record)
  await prisma.interviewRecord.create({
    data: {
      userId,
      jobId: jd1.id,
      type: 'mock',
      score: 78,
      questions: [
        '请介绍一下你在字节跳动负责的前端架构改造项目',
        'React中useEffect和useLayoutEffect的区别是什么',
        '如何优化首屏加载性能',
      ],
      answers: [
        '我在字节跳动主导了创作者平台的微前端改造...',
        'useEffect在DOM更新后异步执行，useLayoutEffect在DOM更新后同步执行...',
        '可以从代码分割、资源预加载、SSR等方面优化...',
      ],
      feedback: {
        overall: '技术基础扎实，项目经验丰富',
        strengths: ['项目表述清晰', '架构设计能力强'],
        improvements: ['需要更深入理解React底层原理', '性能优化方案需要更系统化'],
      },
    },
  });
  console.log('InterviewRecord created.');

  // Verify counts
  const profileCount = await prisma.profile.count({ where: { userId } });
  const educationCount = await prisma.education.count({ where: { userId } });
  const workCount = await prisma.workExperience.count({ where: { userId } });
  const projectCount = await prisma.project.count({ where: { userId } });
  const skillCount = await prisma.skill.count({ where: { userId } });
  const resumeCount = await prisma.resume.count({ where: { userId } });
  const jdCount = await prisma.jobDescription.count({ where: { userId } });
  const atsCount = await prisma.atsReport.count({ where: { userId } });
  const interviewCount = await prisma.interviewRecord.count({ where: { userId } });

  console.log('\n=== Data Verification ===');
  console.log(`Profile: ${profileCount}`);
  console.log(`Education: ${educationCount}`);
  console.log(`WorkExperience: ${workCount}`);
  console.log(`Project: ${projectCount}`);
  console.log(`Skill: ${skillCount}`);
  console.log(`Resume: ${resumeCount}`);
  console.log(`JobDescription: ${jdCount}`);
  console.log(`AtsReport: ${atsCount}`);
  console.log(`InterviewRecord: ${interviewCount}`);
  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });