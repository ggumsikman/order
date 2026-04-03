-- 주문 테이블 생성
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  product_type TEXT NOT NULL,
  design_type TEXT NOT NULL,
  width_cm NUMERIC,
  height_cm NUMERIC,
  quantity INTEGER NOT NULL,
  text_corrections TEXT DEFAULT '',
  shipping_address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  other_requests TEXT DEFAULT '',
  image_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT '접수' CHECK (status IN ('접수', '작업중', '완료', '취소'))
);

-- 최신순 조회를 위한 인덱스
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);

-- RLS 비활성화 (anon key로 읽기/쓰기 허용)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can insert orders" ON orders
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can select orders" ON orders
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon can update orders" ON orders
  FOR UPDATE TO anon USING (true);

-- Storage 버킷 생성 (Supabase 대시보드 > Storage에서 수동으로 만들어도 됨)
-- 버킷 이름: order-images (Public 버킷으로 설정)

-- =============================================
-- 마이그레이션: 시안 확인 시스템 추가
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- =============================================

-- 시안 관련 컬럼 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS draft_images TEXT[] DEFAULT '{}';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS revision_notes TEXT DEFAULT '';

-- status CHECK 제약 업데이트 (새 상태값 포함)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('접수', '작업중', '시안 확인 요청중', '시안 수정 요청', '시안 수정 작업중', '시안 확정', '완료', '취소'));

-- DELETE 권한 추가
CREATE POLICY "anon can delete orders" ON orders
  FOR DELETE TO anon USING (true);

-- =============================================
-- 마이그레이션: 결제 추가 정보 컬럼 추가
-- =============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;

-- =============================================
-- 마이그레이션: 문구/명세서/세부주소 컬럼 추가
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- =============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS text_top TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS text_main TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS text_bottom TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS needs_statement BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS statement_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_detail TEXT;

-- =============================================
-- 마이그레이션: 결제 대기중 상태 + 최종 금액 + 시안 이력
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- =============================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('접수', '작업중', '시안 확인 요청중', '시안 수정 요청', '시안 수정 작업중', '시안 확정', '결제 대기중', '완료', '취소'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_price INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS draft_history JSONB DEFAULT '[]';

-- =============================================
-- 마이그레이션: 배너 시안 관리 테이블
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- =============================================
CREATE TABLE IF NOT EXISTS banner_designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS banner_designs_sort_idx ON banner_designs (sort_order ASC, created_at DESC);

ALTER TABLE banner_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select banner_designs" ON banner_designs
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert banner_designs" ON banner_designs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update banner_designs" ON banner_designs
  FOR UPDATE TO anon USING (true);

CREATE POLICY "anon can delete banner_designs" ON banner_designs
  FOR DELETE TO anon USING (true);
