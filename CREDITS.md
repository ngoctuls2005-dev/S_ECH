# BẢN QUYỀN VÀ NGUỒN TÀI NGUYÊN HÌNH ẢNH ẾCH THẬT 🐸

Dự án **“S ếch”** cam kết sử dụng hình ảnh thực tế được cấp phép hợp pháp (Creative Commons / Public Domain) từ kho tư liệu mở **Wikimedia Commons**.

## Danh sách ghi công 15 loài ếch thực tế

| Tên tiếng Việt | Tên khoa học | Độ hiếm | Tác giả (Artist) | Giấy phép (License) | Nguồn (Source) |
|---|---|---|---|---|---|
| **Ếch Xanh Cơ Bản** | *Pelophylax ridibundus* | Common | Andreas Eichler | CC BY-SA 4.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:2017.06.11.-03-Anglerteiche-Rimbach--Seefrosch.jpg) |
| **Ếch Nâu Đồng** | *Rana temporaria* | Common | Chmee2 | CC BY 3.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Rana_temporaria_in_nature_park_Trho%C5%88_in_2014_(2).jpg) |
| **Ếch Cây Châu Âu** | *Hyla arborea* | Common | Christoph Leeb | CC BY-SA 3.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Laubfrosch.jpg) |
| **Ếch Mắt Đỏ** | *Agalychnis callidryas* | Rare | Carey James Balboa | Public Domain | [Wikimedia](https://commons.wikimedia.org/wiki/File:Red_eyed_tree_frog_edit2.jpg) |
| **Ếch Cà Chua** | *Dyscophus antongilii* | Rare | Franco Andreone | CC BY-SA 2.5 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Dyscophus_antongilii02.jpg) |
| **Ếch Mưa Sa Mạc** | *Breviceps adspersus / macrops* | Rare | Ryanvanhuyssteen | CC BY-SA 4.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Breviceps-adspersus-adspersus.jpg) |
| **Ếch Pacman** | *Ceratophrys cranwelli* | Epic | Pablo H Capovilla | CC BY-SA 4.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Ceratophrys_cranwelli_56095539.jpg) |
| **Ếch Phi Tiêu Độc Xanh** | *Dendrobates tinctorius azureus* | Epic | Michael Gäbler | CC BY 3.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Dendrobates_azureus_(Dendrobates_tinctorius)_Edit.jpg) |
| **Ếch Thủy Tinh** | *Hyalinobatrachium dianae* | Epic | Brian Gratwicke | CC BY 2.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Emerald_Glass_Frog_(Centrolene_prosoblepon)..jpg) |
| **Ếch Rêu Việt Nam** | *Theloderma corticale* | Epic | H. Zell | CC BY-SA 3.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Theloderma_corticale_-_Karlsruhe_Zoo_01.jpg) |
| **Ếch Vàng Panama** | *Atelopus zeteki* | Legendary | Brian Gratwicke | CC BY 2.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Atelopus_zeteki1.jpg) |
| **Ếch Phi Tiêu Độc Vàng** | *Phyllobates terribilis* | Legendary | H. Zell | CC BY-SA 3.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Phyllobates_terribilis_01.JPG) |
| **Ếch Vua Vương Giả** | *Lithobates catesbeianus Rex* | Mythic | Paul Danese | CC BY-SA 4.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:20260831_american_bullfrog_pleasant_valley_wildlife_sanctuary_PD06806.jpg) |
| **Ếch Ngân Hà Vũ Trụ** | *Batrachia Celestia* | Mythic | Benny Trapp | CC BY-SA 3.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:BennyTrapp_Hyla_intermedia_Italien.jpg) |
| **Ếch Thần Ao Sen** | *Pelophylax Sacrum* | Mythic | Charles J. Sharp | CC BY-SA 4.0 | [Wikimedia](https://commons.wikimedia.org/wiki/File:Cyprus_water_frogs_(Pelophylax_cypriensis).jpg) |

### Quy trình xử lý ảnh:
1. Tìm kiếm và chọn lọc ảnh thiên nhiên có giấy phép tự do từ Wikimedia Commons.
2. Trích xuất nền bằng thuật toán thị giác máy tính OpenCV GrabCut với mặt nạ Gaussian Blur khử răng cưa.
3. Chuẩn hóa kích thước 512x512 pixel, căn giữa và tạo khoảng đệm an toàn.
4. Xử lý quang học/hào quang đặc biệt cho các cá thể Mythic (Vương miện hoàng gia, Ngân hà vũ trụ, Hào quang ngọc sen).
5. Xuất và nén định dạng WebP trong suốt tối ưu hiệu năng web.
