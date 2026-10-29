# HUONGMO Gateway (n8n) — hướng dẫn triển khai

Workflow **riêng, tách biệt hoàn toàn** với POP-AI Gateway và CAREER Gateway: file import riêng, webhook path riêng
(`huongmo-gw-*`), khóa ký JWT riêng, bộ đếm/log riêng, credential riêng. Có thể chạy chung 1 n8n.

```
Trình duyệt ──► n8n: /huongmo-gw-token (Firebase ID token ẩn danh -> token 5 phút)
            ──► n8n: /huongmo-gw-chat  (token + mode + nội dung -> LLM -> trả lời)
            ──► n8n: /huongmo-gw-admin (x-admin-key: stats | logs | enable | disable)
```

## 1. Bật đăng nhập ẩn danh trong Firebase (bắt buộc, làm 1 lần)
> Hướng Mở đang dùng **chung project Firebase `career-1733f`** với dự án Career (cùng dữ liệu ngành/trường/tổ hợp). Nếu bạn đã bật Anonymous cho Career thì **bỏ qua bước này**.
Hướng Mở không có màn đăng nhập, nên mỗi trình duyệt tự có 1 tài khoản **ẩn danh** để n8n biết "ai" đang hỏi
(dùng để giới hạn lượt dùng).

Firebase Console → project **career-1733f** → **Authentication** → **Sign-in method** → **Anonymous** → **Enable** → Save.

> Chưa bật thì trợ lý báo "Trợ lý chưa được bật (thiếu đăng nhập ẩn danh…)". Quy tắc Firestore giữ nguyên, không bị ảnh hưởng.

## 2. Tạo credential cho LLM
n8n → **Credentials → New → Header Auth**, đặt tên đúng: `LLM API Key HuongMo`
- Name: `Authorization`
- Value: `Bearer <API key mới>`

Nên dùng một API key riêng cho Hướng Mở (khác POP-AI và Career) để tính phí và thu hồi độc lập.

## 3. Import workflow
n8n → **Workflows → Import from file** → chọn `n8n/huongmo-gateway.json`.
Mở 3 node `LLM 1`, `LLM 2`, `LLM 3` → chọn credential `LLM API Key HuongMo`. Sau đó **Active/Publish**.

URL sẽ là `https://<n8n>/webhook/huongmo-gw-token`, `/huongmo-gw-chat`, `/huongmo-gw-admin`.
Nếu host n8n khác `n8nhosting-67079049.phoaify.com`, sửa `BASE_URL` trong `assets/js/gateway-config.js`.

> Cùng origin `tiepbuoc.github.io` với Career/POP-AI nên `allowedOrigins` mặc định đã dùng được. Mỗi web con được n8n ghi nhận riêng theo `domain/thư-mục-đầu` (ở đây là `tiepbuoc.github.io/Huongmo`).

## 4. Cấu hình (node `Config`)
| Mục | Ý nghĩa |
|---|---|
| `allowedOrigins` | Domain được dùng. Mặc định `https://tiepbuoc.github.io`. Thêm `http://localhost:5500` khi chạy thử |
| `adminKey` | Rỗng = tắt endpoint admin. Đặt chuỗi ngẫu nhiên ≥ 16 ký tự để bật (**đừng commit lên GitHub**) |
| `perUserPerMin / perUserPerDay` | 6 câu/phút, 80 câu/ngày mỗi người dùng |
| `dailyRequestCap / dailyTokenCap` | Trần toàn hệ thống/ngày (1500 câu, 500.000 token) |
| `ipMaxPerMinToken / Chat` | Chặn thô theo IP. Để **cao** (120/200) vì cả lớp quét QR chung 1 IP |
| `models` | Thứ tự fallback: gpt-4.1-mini → gpt-4o-mini → gpt-5-mini |
| `modes` | 3 kiểu gọi AI: `chat`, `plan`, `suggest` — mỗi kiểu có giới hạn độ dài, nhiệt độ, max_tokens riêng |

System prompt mặc định nằm trong node **Chat Gate** (`DEFAULT_PROMPTS`); muốn đổi nhanh, điền `systemPrompt` của mode tương ứng trong `Config`.

### Các mode
| mode | Dùng ở | Lịch sử/bối cảnh | Giới hạn nội dung |
|---|---|---|---|
| `chat` | Khung chat mọi trang | Có | 1.000 ký tự |
| `plan` | `ke-hoach.html` — "Tạo kế hoạch bằng AI" (JSON) | Không | 4.000 ký tự |
| `suggest` | `kham-pha-ban-than.html` — gợi ý ngành (JSON) | Không | 40.000 ký tự |

Nếu danh sách ngành trong Firestore rất lớn và vượt 40.000 ký tự, hãy tăng `maxMessageLen` của `suggest`
(đồng thời xem lại `dailyTokenCap`); khi lỗi, trang tự dùng gợi ý dự phòng theo từ khóa như trước.

## 5. Kiểm tra nhanh
1. Mở trang web → bấm nút chat → hỏi 1 câu → có trả lời.
2. Trang *Khám phá bản thân* và *Lập kế hoạch* → bấm nút AI → có kết quả (không có dòng "dự phòng").
3. (Nếu đặt `adminKey`) `GET /webhook/huongmo-gw-admin` với header `x-admin-key` và `{"action":"stats"}` xem thống kê.

## 6. Lưu ý
- Log/bộ đếm/khóa ký nằm trong *workflow static data* → **mất nếu import đè**. Import đè xong người dùng chỉ cần tải lại trang (token tự cấp lại).
- Tài khoản ẩn danh gắn với trình duyệt: người xóa dữ liệu trình duyệt sẽ thành người dùng mới, né được hạn mức *theo người dùng*; vẫn bị chặn bởi hạn mức theo IP và trần toàn hệ thống.
- Phiên ẩn danh chỉ được tạo khi học sinh **mở khung chat/dùng nút AI**, không tạo cho mọi lượt truy cập.
- Muốn chặn khẩn cấp: `adminKey` + action `disable`, hoặc đặt `enabled: false` trong `Config`.
