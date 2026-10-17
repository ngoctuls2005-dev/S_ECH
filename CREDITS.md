# BẢNG KIỂM TOÁN TÀI NGUYÊN HÌNH ẢNH VÀ BẢN QUYỀN 40 LOÀI ẾCH 🐸
**Dự án:** S ếch (Quality Recovery v3.0)  
**Tiêu chuẩn kiểm toán:** Task B (Bản quyền, Nguồn gốc thực tế, Tách nền, Phân loại minh bạch)  
**Tổng số nhân vật:** 40 loài (100% tài nguyên WebP 512x512 trong suốt, kích thước từ 14.8 KB đến 57.6 KB).

---

## 1. NGUYÊN TẮC VÀ PHÂN LOẠI TÀI NGUYÊN

Cuộc kiểm toán chuyên sâu mã nguồn v3.0 xác định rõ 4 nhóm tài nguyên hình ảnh thực tế trong thư mục `public/assets/frogs/`:

1. **Nhóm A — Ảnh chụp thật đã tách nền (`VERIFIED_REAL_EXTRACTED` - 12 loài):**  
   Ảnh chụp từ tự nhiên thu thập từ Wikimedia Commons với giấy phép tự do (CC BY-SA, CC BY, Public Domain), được tách nền cẩn thận (giữ nguyên chân, ngón, mắt) và tối ưu WebP trong suốt.
2. **Nhóm B — Ảnh nghệ thuật phái sinh từ ảnh thật (`VERIFIED_MYTHIC_DERIVATIVE` - 3 loài):**  
   Tác phẩm phái sinh (Derivative Work) được tạo ra từ ảnh chụp ếch thật có nguồn hợp lệ trên Wikimedia Commons kết hợp các hiệu ứng đồ họa nghệ thuật (Vương miện hoàng gia, Dải ngân hà, Hào quang ngọc sen). Ghi rõ nguồn ảnh gốc, tác giả và không khai báo danh pháp khoa học hư cấu như loài sinh học tự nhiên.
3. **Nhóm C — Ảnh minh họa nội bộ tạm thời (`PLACEHOLDER_ILLUSTRATION` - 23 loài thật):**  
   Ảnh minh họa đồ họa vector được sinh bởi script Python Pillow (`scripts/generate_v2_frog_assets.py`) trong giai đoạn Content Expansion v2.0. Đánh dấu trung thực là **PLACEHOLDER**, nguồn gốc nội bộ `S_ECH Game Team`, kèm liên kết Wikimedia Commons làm tư liệu tham khảo sinh học cho đợt cập nhật ảnh chụp thật tiếp theo.
4. **Nhóm D — Ảnh thần thoại sáng tạo tạm thời (`PLACEHOLDER_MYTHIC` - 2 loài):**  
   Hình ảnh biểu tượng sáng tạo cho các sinh vật thần thoại trong game (`phoenix_frog`, `chronos_frog`). Đánh dấu trung thực là **PLACEHOLDER**, danh pháp được ghi rõ là `Sinh vật thần thoại (Mythic Fictional)` trong lore game.

---

## 2. BẢNG THỐNG KÊ CHI TIẾT 40 LOÀI NHÂN VẬT

| STT | ID Nhân Vật | Tên Việt / Anh | Tên khoa học | Phân Loại Tài Nguyên | Nguồn Gốc File Thực Tế & Tác Giả | Giấy Phép | Dung Lượng | Trạng Thái Kiểm Toán |
|:---:|:---|:---|:---|:---:|:---|:---:|:---:|:---:|
| 1 | `green_frog` | Ếch Xanh Cơ Bản | *Pelophylax ridibundus* | Ảnh thật tách nền | Wikimedia (Andreas Eichler) | CC BY-SA 4.0 | 57.6 KB | **VERIFIED_REAL** |
| 2 | `brown_frog` | Ếch Nâu Đồng | *Rana temporaria* | Ảnh thật tách nền | Wikimedia (Chmee2) | CC BY 3.0 | 31.8 KB | **VERIFIED_REAL** |
| 3 | `tree_frog` | Ếch Cây Châu Âu | *Hyla arborea* | Ảnh thật tách nền | Wikimedia (Christoph Leeb) | CC BY-SA 3.0 | 41.5 KB | **VERIFIED_REAL** |
| 4 | `australian_green_tree_frog` | Ếch Cây Xanh Úc | *Ranoidea caerulea* | Ảnh minh họa vector | In-Engine Pillow (Ref: LiquidGhoul) | Proprietary / Ref PD | 22.6 KB | **PLACEHOLDER** |
| 5 | `gray_tree_frog` | Ếch Cây Xám | *Dryophytes versicolor* | Ảnh minh họa vector | In-Engine Pillow (Ref: Ltshears) | Proprietary / Ref CC BY-SA | 19.3 KB | **PLACEHOLDER** |
| 6 | `wood_frog` | Ếch Gỗ Bắc Mỹ | *Lithobates sylvaticus* | Ảnh minh họa vector | In-Engine Pillow (Ref: Dave Huth) | Proprietary / Ref CC BY | 21.6 KB | **PLACEHOLDER** |
| 7 | `marsh_frog` | Ếch Đầm Lầy | *Pelophylax ridibundus* | Ảnh minh họa vector | In-Engine Pillow (Ref: Marek Szczepanek) | Proprietary / Ref CC BY-SA | 22.9 KB | **PLACEHOLDER** |
| 8 | `fire_bellied_toad` | Cóc Bụng Lửa Đông Dương | *Bombina orientalis* | Ảnh minh họa vector | In-Engine Pillow (Ref: Christian Fischer) | Proprietary / Ref CC BY-SA | 23.2 KB | **PLACEHOLDER** |
| 9 | `red_eyed_frog` | Ếch Mắt Đỏ | *Agalychnis callidryas* | Ảnh thật tách nền | Wikimedia (Carey James Balboa) | Public Domain | 32.2 KB | **VERIFIED_REAL** |
| 10 | `tomato_frog` | Ếch Cà Chua | *Dyscophus antongilii* | Ảnh thật tách nền | Wikimedia (Franco Andreone) | CC BY-SA 2.5 | 32.4 KB | **VERIFIED_REAL** |
| 11 | `rain_frog` | Ếch Mưa Sa Mạc | *Breviceps adspersus* | Ảnh thật tách nền | Wikimedia (Ryanvanhuyssteen) | CC BY-SA 4.0 | 38.0 KB | **VERIFIED_REAL** |
| 12 | `amazon_milk_frog` | Ếch Sữa Amazon | *Trachycephalus resinifictrix* | Ảnh minh họa vector | In-Engine Pillow (Ref: H. Zell) | Proprietary / Ref CC BY-SA | 21.9 KB | **PLACEHOLDER** |
| 13 | `white_lipped_tree_frog` | Ếch Cây Môi Trắng | *Nyctimystes infrafrenatus* | Ảnh minh họa vector | In-Engine Pillow (Ref: Benjamint444) | Proprietary / Ref GFDL/CC | 24.2 KB | **PLACEHOLDER** |
| 14 | `african_bullfrog` | Ếch Bò Châu Phi | *Pyxicephalus adspersus* | Ảnh minh họa vector | In-Engine Pillow (Ref: Paul Cools) | Proprietary / Ref CC BY-SA | 20.1 KB | **PLACEHOLDER** |
| 15 | `harlequin_toad` | Cóc Chú Hề Biến Màu | *Atelopus varius* | Ảnh minh họa vector | In-Engine Pillow (Ref: Brian Gratwicke) | Proprietary / Ref CC BY | 23.0 KB | **PLACEHOLDER** |
| 16 | `goliath_frog` | Ếch Khổng Lồ Goliath | *Conraua goliath* | Ảnh minh họa vector | In-Engine Pillow (Ref: Benny Trapp) | Proprietary / Ref CC BY-SA | 20.7 KB | **PLACEHOLDER** |
| 17 | `clown_tree_frog` | Ếch Cây Hề Sarayacu | *Dendropsophus sarayacuensis* | Ảnh minh họa vector | In-Engine Pillow (Ref: Geoff Gallice) | Proprietary / Ref CC BY | 26.8 KB | **PLACEHOLDER** |
| 18 | `spotted_salamander_frog` | Ếch Chạy Đốm Kassina | *Kassina senegalensis* | Ảnh minh họa vector | In-Engine Pillow (Ref: Bernard DUPONT) | Proprietary / Ref CC BY-SA | 24.2 KB | **PLACEHOLDER** |
| 19 | `pacman_frog` | Ếch Pacman | *Ceratophrys cranwelli* | Ảnh thật tách nền | Wikimedia (Pablo H Capovilla) | CC BY-SA 4.0 | 55.4 KB | **VERIFIED_REAL** |
| 20 | `blue_poison_frog` | Ếch Phi Tiêu Độc Xanh | *Dendrobates tinctorius azureus* | Ảnh thật tách nền | Wikimedia (Michael Gäbler) | CC BY 3.0 | 31.3 KB | **VERIFIED_REAL** |
| 21 | `glass_frog` | Ếch Thủy Tinh | *Centrolene prosoblepon* | Ảnh thật tách nền | Wikimedia (Brian Gratwicke) | CC BY 2.0 | 14.8 KB | **VERIFIED_REAL** |
| 22 | `mossy_frog` | Ếch Rêu Việt Nam | *Theloderma corticale* | Ảnh thật tách nền | Wikimedia (H. Zell) | CC BY-SA 3.0 | 42.6 KB | **VERIFIED_REAL** |
| 23 | `ornate_horned_frog` | Ếch Sừng Hoa Văn | *Ceratophrys ornata* | Ảnh minh họa vector | In-Engine Pillow (Ref: Gerd A.T. Müller) | Proprietary / Ref CC BY-SA | 24.5 KB | **PLACEHOLDER** |
| 24 | `strawberry_poison_frog` | Ếch Phi Tiêu Dâu Tây | *Oophaga pumilio* | Ảnh minh họa vector | In-Engine Pillow (Ref: Arturo de Frias) | Proprietary / Ref CC BY-SA | 24.9 KB | **PLACEHOLDER** |
| 25 | `yellow_banded_poison_frog` | Ếch Phi Tiêu Vàng Đen | *Dendrobates leucomelas* | Ảnh minh họa vector | In-Engine Pillow (Ref: H. Zell) | Proprietary / Ref CC BY-SA | 26.2 KB | **PLACEHOLDER** |
| 26 | `giant_monkey_frog` | Ếch Khỉ Khổng Lồ | *Phyllomedusa bicolor* | Ảnh minh họa vector | In-Engine Pillow (Ref: Tim Vickers) | Proprietary / Ref PD | 24.5 KB | **PLACEHOLDER** |
| 27 | `tiger_leg_monkey_frog` | Ếch Khỉ Chân Hổ | *Phyllomedusa hypochondrialis* | Ảnh minh họa vector | In-Engine Pillow (Ref: Vassil) | Proprietary / Ref CC0 | 27.2 KB | **PLACEHOLDER** |
| 28 | `splendid_leaf_frog` | Ếch Lá Lộng Lẫy | *Cruziohyla calcarifer* | Ảnh minh họa vector | In-Engine Pillow (Ref: Brian Gratwicke) | Proprietary / Ref CC BY | 25.1 KB | **PLACEHOLDER** |
| 29 | `borneo_eared_frog` | Ếch Tai Borneo | *Polypedates otilophus* | Ảnh minh họa vector | In-Engine Pillow (Ref: Chien C. Lee) | Proprietary / Ref CC BY-SA | 25.5 KB | **PLACEHOLDER** |
| 30 | `golden_frog` | Ếch Vàng Panama | *Atelopus zeteki* | Ảnh thật tách nền | Wikimedia (Brian Gratwicke) | CC BY 2.0 | 23.3 KB | **VERIFIED_REAL** |
| 31 | `golden_dart_frog` | Ếch Phi Tiêu Độc Vàng | *Phyllobates terribilis* | Ảnh thật tách nền | Wikimedia (H. Zell) | CC BY-SA 3.0 | 22.6 KB | **VERIFIED_REAL** |
| 32 | `wallace_flying_frog` | Ếch Bay Wallace | *Rhacophorus nigropalmatus* | Ảnh minh họa vector | In-Engine Pillow (Ref: Tim Laman) | Proprietary / Ref CC BY-SA | 28.8 KB | **PLACEHOLDER** |
| 33 | `black_rain_frog` | Ếch Mưa Đen | *Breviceps fuscus* | Ảnh minh họa vector | In-Engine Pillow (Ref: Alan Manson) | Proprietary / Ref CC BY-SA | 16.3 KB | **PLACEHOLDER** |
| 34 | `granular_poison_frog` | Ếch Phi Tiêu Hạt Sần | *Oophaga granulifera* | Ảnh minh họa vector | In-Engine Pillow (Ref: Brian Gratwicke) | Proprietary / Ref CC BY | 26.5 KB | **PLACEHOLDER** |
| 35 | `malayan_horned_frog` | Ếch Sừng Mã Lai | *Megophrys nasuta* | Ảnh minh họa vector | In-Engine Pillow (Ref: Bernard Dupont) | Proprietary / Ref CC BY-SA | 24.6 KB | **PLACEHOLDER** |
| 36 | `king_frog` | Ếch Vua Vương Giả | *Lithobates catesbeianus (Biến thể)* | Ảnh phái sinh Mythic | Phái sinh từ Wikimedia (Paul Danese) | CC BY-SA 4.0 / Creative Edit | 47.9 KB | **VERIFIED_MYTHIC** |
| 37 | `galaxy_frog` | Ếch Ngân Hà Vũ Trụ | *Hyla intermedia (Biến thể)* | Ảnh phái sinh Mythic | Phái sinh từ Wikimedia (Benny Trapp) | CC BY-SA 3.0 / Creative Edit | 37.7 KB | **VERIFIED_MYTHIC** |
| 38 | `lotus_guardian_frog` | Ếch Thần Ao Sen | *Pelophylax cypriensis (Biến thể)* | Ảnh phái sinh Mythic | Phái sinh từ Wikimedia (Charles J. Sharp) | CC BY-SA 4.0 / Creative Edit | 29.5 KB | **VERIFIED_MYTHIC** |
| 39 | `phoenix_frog` | Ếch Phượng Hoàng Lửa | *Sinh vật thần thoại (Mythic Lore)* | Ảnh thần thoại tạm thời | In-Engine Pillow (S_ECH Creative) | Proprietary / Mythic Asset | 33.3 KB | **PLACEHOLDER_MYTHIC** |
| 40 | `chronos_frog` | Ếch Thời Gian Vĩnh Cửu | *Sinh vật thần thoại (Mythic Lore)* | Ảnh thần thoại tạm thời | In-Engine Pillow (S_ECH Creative) | Proprietary / Mythic Asset | 33.4 KB | **PLACEHOLDER_MYTHIC** |

---

## 3. KẾT LUẬN VÀ CAM KẾT CHẤT LƯỢNG

1. **Tính toàn vẹn hệ thống:** 100% 40 loài ếch đều có tệp ảnh WebP trong suốt tồn tại đầy đủ tại `public/assets/frogs/`, không có liên kết gãy hoặc hình ảnh hỏng.
2. **Minh bạch bản quyền:** Không còn tình trạng khai man hình ảnh vector vẽ bằng mã nguồn là ảnh chụp thực tế từ Wikimedia Commons. Các tài nguyên tạm thời được định danh rõ ràng là `PLACEHOLDER`, bảo toàn danh mục và ID để người chơi không bị mất dữ liệu sưu tầm.
3. **Định hướng v4.0:** Khi môi trường mạng hoặc bộ asset ngoại tuyến chất lượng cao được cung cấp, các tài nguyên `PLACEHOLDER` sẽ lần lượt được thay thế bằng ảnh chụp sinh học thực tế đã tách nền chuẩn OpenCV GrabCut.
