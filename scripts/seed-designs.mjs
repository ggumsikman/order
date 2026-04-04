// 시안 이미지 Supabase 업로드 & designs 테이블 등록 스크립트
// 실행: node scripts/seed-designs.mjs

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = 'https://utocpgulebqakzwubvbr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0b2NwZ3VsZWJxYWt6d3VidmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTQ1MDQsImV4cCI6MjA5MDUzMDUwNH0.ylc90Mo4L3GqnkxfGbdlD7i-rbsr-Qd2BJnOIMKkIKI'
const BUCKET = 'order-images'
const BASE_PATH = 'C:/Users/leese/OneDrive/문서/카카오톡 받은 파일/일비롱디자인/상품'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── 시안 목록 ────────────────────────────────────────────────
const DESIGNS = [
  // ── 현수막 / 가을 ──
  { name: '가을빛선율',      product_type: '현수막', category: '가을', sort_order: 1,  file: '현수막/KakaoTalk_20260404_085726492_04.png' },
  { name: '가을수확',        product_type: '현수막', category: '가을', sort_order: 2,  file: '현수막/KakaoTalk_20260404_085726492_05.png' },
  { name: '가을음악단',      product_type: '현수막', category: '가을', sort_order: 3,  file: '현수막/KakaoTalk_20260404_085726492_06.png' },
  { name: '가을메모',        product_type: '현수막', category: '가을', sort_order: 4,  file: '현수막/KakaoTalk_20260404_085726492_07.png' },
  { name: '가을독서',        product_type: '현수막', category: '가을', sort_order: 5,  file: '현수막/KakaoTalk_20260404_085726492_08.png' },
  { name: '바스락낙엽',      product_type: '현수막', category: '가을', sort_order: 6,  file: '현수막/KakaoTalk_20260404_085726492_09.png' },
  { name: '가을전시회',      product_type: '현수막', category: '가을', sort_order: 7,  file: '현수막/KakaoTalk_20260404_085726492_10.png' },

  // ── 현수막 / 김장 ──
  { name: '구름김장',          product_type: '현수막', category: '김장', sort_order: 8,  file: '현수막/KakaoTalk_20260404_090242185.jpg' },
  { name: '오물조물깍두기',    product_type: '현수막', category: '김장', sort_order: 9,  file: '현수막/KakaoTalk_20260404_090242185_01.jpg' },
  { name: '하트김장',          product_type: '현수막', category: '김장', sort_order: 10, file: '현수막/KakaoTalk_20260404_090242185_03.jpg' },
  { name: '수확기쁨',          product_type: '현수막', category: '김장', sort_order: 11, file: '현수막/KakaoTalk_20260404_090242185_04.jpg' },
  { name: '꼬마농부',          product_type: '현수막', category: '김장', sort_order: 12, file: '현수막/KakaoTalk_20260404_090242185_05.jpg' },
  { name: '마당김장(실사)',     product_type: '현수막', category: '김장', sort_order: 13, file: '현수막/KakaoTalk_20260404_090242185_06.jpg' },
  { name: '담벼락김장(실사)',   product_type: '현수막', category: '김장', sort_order: 14, file: '현수막/KakaoTalk_20260404_090242185_07.jpg' },
  { name: '배추밭(실사)',       product_type: '현수막', category: '김장', sort_order: 15, file: '현수막/KakaoTalk_20260404_090242185_08.jpg' },
  { name: '야외김장',          product_type: '현수막', category: '김장', sort_order: 16, file: '현수막/KakaoTalk_20260404_090242185_09.jpg' },
  { name: '김장하는날',        product_type: '현수막', category: '김장', sort_order: 17, file: '현수막/KakaoTalk_20260404_090242185_10.jpg' },
  { name: '김장재료포토존',    product_type: '현수막', category: '김장', sort_order: 18, file: '현수막/KakaoTalk_20260404_090242185_11.jpg' },
  { name: '큐트김장',          product_type: '현수막', category: '김장', sort_order: 19, file: '현수막/KakaoTalk_20260404_090242185_12.jpg' },
  { name: '아삭아삭깍두기',    product_type: '현수막', category: '김장', sort_order: 20, file: '현수막/KakaoTalk_20260404_090242185_13.jpg' },
  { name: '돌담김장',          product_type: '현수막', category: '김장', sort_order: 21, file: '현수막/KakaoTalk_20260404_090242185_14.jpg' },
  { name: '김장데이',          product_type: '현수막', category: '김장', sort_order: 22, file: '현수막/KakaoTalk_20260404_090242185_15.jpg' },

  // ── 배너 / 가을 ──
  { name: '가을빛선율',      product_type: '배너', category: '가을', sort_order: 1,  file: '배너/KakaoTalk_20260404_085726492_12.png' },
  { name: '가을수확',        product_type: '배너', category: '가을', sort_order: 2,  file: '배너/KakaoTalk_20260404_085726492_13.png' },
  { name: '가을음악단',      product_type: '배너', category: '가을', sort_order: 3,  file: '배너/KakaoTalk_20260404_085726492_14.png' },
  { name: '가을메모',        product_type: '배너', category: '가을', sort_order: 4,  file: '배너/KakaoTalk_20260404_085726492_15.png' },
  { name: '가을독서',        product_type: '배너', category: '가을', sort_order: 5,  file: '배너/KakaoTalk_20260404_085726492_16.png' },
  { name: '바스락낙엽',      product_type: '배너', category: '가을', sort_order: 6,  file: '배너/KakaoTalk_20260404_085726492.png' },
  { name: '가을전시회',      product_type: '배너', category: '가을', sort_order: 7,  file: '배너/KakaoTalk_20260404_085726492_01.png' },

  // ── 배너 / 김장 ──
  { name: '구름김장',          product_type: '배너', category: '김장', sort_order: 8,  file: '배너/KakaoTalk_20260404_090135890_01.png' },
  { name: '오물조물깍두기',    product_type: '배너', category: '김장', sort_order: 9,  file: '배너/KakaoTalk_20260404_090135890_02.png' },
  { name: '하트김장',          product_type: '배너', category: '김장', sort_order: 10, file: '배너/KakaoTalk_20260404_090135890_03.png' },
  { name: '수확기쁨',          product_type: '배너', category: '김장', sort_order: 11, file: '배너/KakaoTalk_20260404_090135890_04.png' },
  { name: '꼬마농부',          product_type: '배너', category: '김장', sort_order: 12, file: '배너/KakaoTalk_20260404_090135890_05.png' },
  { name: '김장하는날',        product_type: '배너', category: '김장', sort_order: 13, file: '배너/KakaoTalk_20260404_090135890_06.png' },
  { name: '김장재료포토존',    product_type: '배너', category: '김장', sort_order: 14, file: '배너/KakaoTalk_20260404_090135890_07.png' },
  { name: '큐트김장',          product_type: '배너', category: '김장', sort_order: 15, file: '배너/KakaoTalk_20260404_090135890_08.png' },
  { name: '아삭아삭깍두기',    product_type: '배너', category: '김장', sort_order: 16, file: '배너/KakaoTalk_20260404_090135890_09.png' },
  { name: '돌담김장',          product_type: '배너', category: '김장', sort_order: 17, file: '배너/KakaoTalk_20260404_090135890_10.png' },
  { name: '김장데이',          product_type: '배너', category: '김장', sort_order: 18, file: '배너/KakaoTalk_20260404_090135890_11.png' },
]

// ─── 업로드 실행 ──────────────────────────────────────────────
async function uploadAndRegister() {
  console.log(`\n총 ${DESIGNS.length}개 시안 등록 시작...\n`)

  let success = 0
  let failed = 0

  for (const design of DESIGNS) {
    const localPath = path.join(BASE_PATH, design.file)
    const ext = path.extname(design.file)
    const originalFilename = path.basename(design.file)
    const folder = design.product_type === '현수막' ? 'banner' : 'stand-banner'
    const storagePath = `designs/${folder}/${originalFilename}`

    // 파일 존재 확인
    if (!fs.existsSync(localPath)) {
      console.error(`  ✗ 파일 없음: ${design.file}`)
      failed++
      continue
    }

    try {
      // 1. Supabase Storage 업로드
      const fileBuffer = fs.readFileSync(localPath)
      const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        })

      if (uploadError) {
        console.error(`  ✗ 업로드 실패 [${design.name}]: ${uploadError.message}`)
        failed++
        continue
      }

      // 2. 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath)

      // 3. designs 테이블에 insert
      const { error: dbError } = await supabase
        .from('designs')
        .insert({
          name: design.name,
          thumbnail_url: publicUrl,
          product_type: design.product_type,
          category: design.category,
          sort_order: design.sort_order,
          active: true,
        })

      if (dbError) {
        console.error(`  ✗ DB 등록 실패 [${design.name}]: ${dbError.message}`)
        failed++
        continue
      }

      console.log(`  ✓ [${design.product_type}] ${design.name} (${design.category})`)
      success++
    } catch (err) {
      console.error(`  ✗ 오류 [${design.name}]: ${err.message}`)
      failed++
    }
  }

  console.log(`\n완료: 성공 ${success}개 / 실패 ${failed}개`)
}

uploadAndRegister()
