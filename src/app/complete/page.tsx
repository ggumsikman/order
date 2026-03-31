import Link from 'next/link'

export default function CompletePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">주문이 접수되었습니다!</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          담당자가 확인 후 빠르게 연락드리겠습니다.<br />
          감사합니다!
        </p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition"
        >
          새 주문 접수하기
        </Link>
      </div>
    </div>
  )
}
