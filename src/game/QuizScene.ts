
import * as Phaser from "phaser";

type RoundKey = "1" | "2" | "3";

type PillarKey = "economy" | "politics" | "law" | "culture";

type RoundTone = {
  accent: number;
  soft: number;
  wash: number;
  optionFill: number;
  optionHover: number;
  optionStroke: number;
};

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  nearCorrect?: number[];
  explanation?: string;
  points: number;
  nearPoints?: number;
  pillar?: PillarKey;
  consequenceCorrect?: string;
  consequenceNear?: string;
  consequenceWrong?: string;
  riskPenalty?: number;
  timeLimitSec?: number;
};

type AnswerKind = "correct" | "near" | "wrong";

const THEME = {
  background: 0xf3ece6,
  backgroundAccent: 0xf7e2d8,
  panel: 0xfffbf8,
  panelAlt: 0xf2e6db,
  panelStroke: 0xcdb3a3,
  accent: 0xc58e6f,
  accentSoft: 0x7b5a4a,
  text: "#2f2520",
  muted: "#6f6057",
  optionFill: 0xfff5ee,
  optionHover: 0xf1e0d2,
  optionStroke: 0xd4bfa9,
  buttonFill: 0xe9d5c5,
  buttonHover: 0xdfc8b4,
  buttonStroke: 0xbfa693,
  success: 0x8fb6a0,
  danger: 0xd69b93,
};

const FONTS = {
  title: "\"Segoe UI Semibold\", \"Segoe UI\", \"Helvetica Neue\", sans-serif",
  body: "\"Segoe UI\", \"Helvetica Neue\", sans-serif",
};

const ROUND_CONFIG: Record<RoundKey, {
  title: string;
  subtitle: string;
  targetCount: number;
  timeLimitSec: number;
}> = {
  "1": {
    title: "Vòng 1: Đặt Móng – 4 Trụ Cơ Sở",
    subtitle: "Kinh tế • Chính trị • Pháp lý • Văn hóa – đạo đức",
    targetCount: 15,
    timeLimitSec: 12,
  },
  "2": {
    title: "Vòng 2: Giữ Nhà – Tình Huống & Trả Giá",
    subtitle: "Tình yêu chưa đủ • Tự do & Trách nhiệm xã hội",
    targetCount: 15,
    timeLimitSec: 20,
  },
  "3": {
    title: "Vòng 3: Viên Mãn – Tổng Kết 1–7",
    subtitle: "Tốc độ + loại • Quyết định cuối",
    targetCount: 15,
    timeLimitSec: 8,
  },
};

const ROUND_TONES: Record<RoundKey, RoundTone> = {
  "1": {
    accent: 0xc58e6f,
    soft: 0x8a6a5a,
    wash: 0xf4e7dd,
    optionFill: 0xfff3ea,
    optionHover: 0xf1ddce,
    optionStroke: 0xd4bfa9,
  },
  "2": {
    accent: 0xc06b7a,
    soft: 0x9a6770,
    wash: 0xf5e2e6,
    optionFill: 0xffeef1,
    optionHover: 0xf2d7dc,
    optionStroke: 0xd9b5bd,
  },
  "3": {
    accent: 0x5f8fa3,
    soft: 0x6a7c85,
    wash: 0xe5f0f3,
    optionFill: 0xeff7f9,
    optionHover: 0xd8e8ee,
    optionStroke: 0xb6c9d1,
  },
};

const PILLARS: Record<PillarKey, { label: string; color: number }> = {
  economy: { label: "Kinh tế", color: 0xc7a27d },
  politics: { label: "Chính trị", color: 0xb08f7a },
  law: { label: "Pháp lý", color: 0x9c7c6f },
  culture: { label: "Văn hóa – đạo đức", color: 0xa88d76 },
};

const FALLBACK_QUESTIONS: Record<RoundKey, QuizQuestion[]> = {
  "1": [
    {
      id: "r1-economy",
      text: "Cơ sở kinh tế của gia đình trong thời kỳ quá độ gắn chặt nhất với yếu tố nào?",
      options: [
        "Điều kiện lao động, thu nhập và tổ chức đời sống vật chất",
        "Cảm xúc cá nhân",
        "Sở thích tiêu dùng",
        "Xu hướng mạng xã hội",
      ],
      correctIndex: 0,
      points: 2,
      pillar: "economy",
      explanation: "Kinh tế là nền móng vật chất của gia đình trong TKQĐ.",
    },
    {
      id: "r1-law",
      text: "Cơ sở pháp lý trong xây dựng gia đình thể hiện rõ nhất qua yếu tố nào?",
      options: [
        "Luật và chuẩn mực được xã hội thừa nhận",
        "Ý kiến bạn bè",
        "Tập quán riêng của từng nhà",
        "Gu cá nhân",
      ],
      correctIndex: 0,
      points: 2,
      pillar: "law",
      explanation: "Luật bảo vệ quyền và nghĩa vụ, tạo nền tảng bền vững.",
    },
    {
      id: "r1-culture",
      text: "Vai trò của văn hóa – đạo đức trong xây dựng gia đình là gì?",
      options: [
        "Giữ nề nếp, tôn trọng và gắn kết các thành viên",
        "Không ảnh hưởng nhiều",
        "Chỉ mang tính hình thức",
        "Là chuyện riêng từng người",
      ],
      correctIndex: 0,
      points: 2,
      pillar: "culture",
      explanation: "Văn hóa – đạo đức là trụ tinh thần của gia đình.",
    },
    {
      id: "r1-politics",
      text: "Cơ sở chính trị trong xây dựng gia đình thể hiện qua yếu tố nào?",
      options: [
        "Vai trò định hướng của Nhà nước và tổ chức xã hội",
        "Sở thích cá nhân",
        "Thị hiếu thời trang",
        "Mức độ giàu có",
      ],
      correctIndex: 0,
      points: 2,
      pillar: "politics",
      explanation: "Chính sách và định hướng xã hội tác động trực tiếp đến gia đình.",
    },
  ],
  "2": [
    {
      id: "r2-love",
      text: "Hai bạn yêu nhau 3 năm. Một người muốn cưới ngay, người kia muốn ổn định tài chính và đăng ký kết hôn đúng pháp luật. Chọn hướng xử lý nào bền hơn?",
      options: [
        "Kết hợp tình yêu với kế hoạch kinh tế và pháp lý rõ ràng",
        "Cưới ngay vì yêu là đủ",
        "Trì hoãn vô thời hạn",
        "Lấy ý kiến bạn bè quyết định",
      ],
      correctIndex: 0,
      points: 3,
      pillar: "economy",
      consequenceCorrect: "Gia đình có nền tảng vững và giảm rủi ro xung đột.",
      consequenceWrong: "Mái nhà có thể sập nếu trụ kinh tế và pháp lý yếu.",
      riskPenalty: -1,
    },
    {
      id: "r2-freedom",
      text: "Một người muốn tự do theo đuổi học tập xa, người kia muốn ưu tiên chăm sóc gia đình. Cách dung hòa đúng tinh thần “tự do cá nhân đi cùng trách nhiệm xã hội”?",
      options: [
        "Thỏa thuận, phân công rõ ràng và hỗ trợ nhau",
        "Cấm hoàn toàn để giữ gia đình",
        "Bỏ mặc gia đình để theo đuổi cá nhân",
        "Giấu kế hoạch để tránh mâu thuẫn",
      ],
      correctIndex: 0,
      points: 3,
      pillar: "culture",
      consequenceCorrect: "Tự do được đảm bảo, trách nhiệm vẫn giữ vững.",
      consequenceWrong: "Tự do cực đoan làm gia đình rạn nứt.",
      riskPenalty: -1,
    },
    {
      id: "r2-legal",
      text: "Sống chung không đăng ký kết hôn, khi xảy ra tranh chấp quyền lợi thì giải pháp phù hợp là gì?",
      options: [
        "Cần hợp thức hóa pháp lý để bảo đảm quyền và nghĩa vụ",
        "Cứ để tình cảm giải quyết",
        "Nhờ mạng xã hội phân xử",
        "Chia tay để tránh rắc rối",
      ],
      correctIndex: 0,
      points: 3,
      pillar: "law",
      consequenceCorrect: "Pháp lý bảo vệ công bằng, tránh thiệt thòi lâu dài.",
      consequenceWrong: "Gia đình rơi vào khoảng trống trách nhiệm.",
      riskPenalty: -1,
    },
    {
      id: "r2-family",
      text: "Gia đình hai bên can thiệp sâu khiến mâu thuẫn tăng. Cách xử lý tiến bộ?",
      options: [
        "Đối thoại, tôn trọng văn hóa nhưng đặt ranh giới rõ",
        "Cắt đứt hoàn toàn liên hệ",
        "Im lặng để mọi thứ tự lắng xuống",
        "Nhờ người ngoài quyết định",
      ],
      correctIndex: 0,
      points: 3,
      pillar: "culture",
      consequenceCorrect: "Giữ được hòa khí và sự tôn trọng đôi bên.",
      consequenceWrong: "Mâu thuẫn âm ỉ dễ bùng nổ.",
      riskPenalty: -1,
    },
  ],
  "3": [
    {
      id: "r3-review-1",
      text: "Chọn keyword đúng cho “cơ sở pháp lý”:",
      options: ["Luật – chuẩn mực – bảo đảm thực thi", "Gu cá nhân", "Tâm lý", "Phong trào"],
      correctIndex: 0,
      points: 3,
      timeLimitSec: 10,
    },
    {
      id: "r3-review-2",
      text: "(Đ/S) Hôn nhân chỉ là chuyện riêng tư, xã hội không liên quan.",
      options: ["Sai", "Đúng"],
      correctIndex: 0,
      points: 3,
      timeLimitSec: 9,
    },
    {
      id: "r3-review-3",
      text: "Thông điệp chốt của Chương 7 là gì?",
      options: [
        "Hôn nhân không chỉ là chuyện hai người mà còn là chuyện xã hội",
        "Tình yêu là đủ",
        "Gia đình không cần trách nhiệm",
        "Pháp luật không cần thiết",
      ],
      correctIndex: 0,
      points: 3,
      timeLimitSec: 10,
    },
    {
      id: "r3-review-4",
      text: "Mục tiêu khi xây dựng gia đình XHCN là:",
      options: [
        "Hài hòa tự do cá nhân và trách nhiệm xã hội",
        "Tự do tuyệt đối",
        "Chỉ cần lợi ích cá nhân",
        "Bỏ qua chuẩn mực",
      ],
      correctIndex: 0,
      points: 3,
      timeLimitSec: 10,
    },
  ],
};

const BOSS_PROMPT: QuizQuestion = {
  id: "boss-final",
  text: "Boss cuối: “Hôn nhân không chỉ là chuyện hai người mà còn là chuyện xã hội” – bạn đồng ý không?",
  options: [
    "Đồng ý – gia đình gắn với cộng đồng và sự ổn định xã hội",
    "Không đồng ý – hoàn toàn là chuyện riêng tư",
  ],
  correctIndex: 0,
  points: 6,
  explanation:
    "Trả lời đúng khi chỉ ra được vai trò xã hội của gia đình, liên hệ trách nhiệm cộng đồng.",
};

const toHex = (value: number) => `#${value.toString(16).padStart(6, "0")}`;

export class QuizScene extends Phaser.Scene {
  private score = 0;
  private round: RoundKey = "1";
  private questionsByRound: Record<RoundKey, QuizQuestion[]> = {
    "1": [],
    "2": [],
    "3": [],
  };
  private roundQuestions: QuizQuestion[] = [];
  private questionIndex = 0;
  private startTime = 0;
  private questionStartTime = 0;
  private totalQuestions = 0;
  private hudObjects: Phaser.GameObjects.GameObject[] = [];
  private transientObjects: Phaser.GameObjects.GameObject[] = [];
  private backgroundObjects: Phaser.GameObjects.GameObject[] = [];

  private scoreText?: Phaser.GameObjects.Text;
  private roundText?: Phaser.GameObjects.Text;
  private subtitleText?: Phaser.GameObjects.Text;
  private progressText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private roofText?: Phaser.GameObjects.Text;
  private pillarBar?: Phaser.GameObjects.Graphics;
  private pillarLabels: Partial<Record<PillarKey, Phaser.GameObjects.Text>> = {};
  private pillarLayout?: {
    left: number;
    barWidth: number;
    startY: number;
    barHeight: number;
    rowHeight: number;
  };
  private roundWash?: Phaser.GameObjects.Rectangle;
  private hudBottom = 160;
  private stormTimer?: Phaser.Time.TimerEvent;
  private lightningLayer?: Phaser.GameObjects.Graphics;
  private lightningFlash?: Phaser.GameObjects.Rectangle;
  private stormDim?: Phaser.GameObjects.Rectangle;
  private stormClouds: Phaser.GameObjects.Container[] = [];

  private timerEvent?: Phaser.Time.TimerEvent;
  private inputLocked = false;

  private pillarScores: Record<PillarKey, number> = {
    economy: 50,
    politics: 50,
    law: 50,
    culture: 50,
  };
  private windPillar: PillarKey | null = null;
  private roundCorrect = 0;
  private roundNear = 0;
  private roundWrong = 0;
  private eliminationLives = 2;
  private bossDone = false;
  private correctStreak = 0;
  private lastPenaltyReason = "";

  constructor() {
    super("QuizScene");
  }

  preload() {
    this.load.image("family", "/images/family.svg");
    this.load.image("house", "/images/house.svg");
    this.load.image("rings", "/images/rings.svg");
    this.load.image("hearts", "/images/hearts.svg");
  }

  create() {
    const { width, height } = this.scale;
    this.startTime = this.time.now;

    this.cameras.main.setBackgroundColor(THEME.background);
    this.add.rectangle(0, 0, width, height, THEME.background).setOrigin(0);
    this.add
      .rectangle(0, 0, width, height * 0.26, THEME.backgroundAccent)
      .setOrigin(0)
      .setAlpha(0.9);
    const tone = this.getTone();
    this.roundWash = this.add
      .rectangle(0, height * 0.26, width, height * 0.74, tone.wash)
      .setOrigin(0)
      .setAlpha(0.28);

    this.createBackdrop(width, height);

    const frame = this.add.graphics();
    frame.lineStyle(1, THEME.panelStroke, 0.6);
    frame.strokeRoundedRect(16, 16, width - 32, height - 32, 24);

    this.createHud();
    this.renderLoading();
    this.loadQuizBank();
  }

  private createHud() {
    const { width } = this.scale;
    const layout = this.getLayout();
    const left = layout.left;
    const right = left + layout.width;
    let headerWidth = Math.min(560, layout.width * 0.62);
    const headerHeight = 92;
    const headerX = left;
    const headerY = 16;

    let statsWidth = Math.min(240, layout.width * 0.28);
    const statsHeight = 92;
    let statsX = right - statsWidth;
    let statsY = 16;

    let statusWidth = Math.min(360, layout.width * 0.5);
    const statusHeight = 108;
    let statusX = left;
    let statusY = 118;

    const gutter = 12;
    if (statsX < headerX + headerWidth + gutter) {
      statsWidth = headerWidth;
      statsX = headerX;
      statsY = headerY + headerHeight + 10;
      statusWidth = Math.min(layout.width, headerWidth);
      statusX = headerX;
      statusY = statsY + statsHeight + 10;
    } else {
      headerWidth = Math.max(260, statsX - headerX - gutter);
    }

    const headerPanel = this.add.graphics();
    headerPanel.fillStyle(THEME.panel, 0.98);
    headerPanel.fillRoundedRect(headerX, headerY, headerWidth, headerHeight, 18);
    headerPanel.lineStyle(1, THEME.panelStroke, 0.7);
    headerPanel.strokeRoundedRect(headerX, headerY, headerWidth, headerHeight, 18);

    const statsPanel = this.add.graphics();
    statsPanel.fillStyle(THEME.panelAlt, 0.95);
    statsPanel.fillRoundedRect(statsX, statsY, statsWidth, statsHeight, 18);
    statsPanel.lineStyle(1, THEME.panelStroke, 0.6);
    statsPanel.strokeRoundedRect(statsX, statsY, statsWidth, statsHeight, 18);

    const statusPanel = this.add.graphics();
    statusPanel.fillStyle(THEME.panelAlt, 0.9);
    statusPanel.fillRoundedRect(statusX, statusY, statusWidth, statusHeight, 16);
    statusPanel.lineStyle(1, THEME.panelStroke, 0.55);
    statusPanel.strokeRoundedRect(statusX, statusY, statusWidth, statusHeight, 16);

    const title = this.add.text(headerX + 18, headerY + 16, "XÂY NHÀ GIA ĐÌNH TKQĐ", {
      fontFamily: FONTS.title,
      fontSize: "22px",
      color: toHex(THEME.accentSoft),
      letterSpacing: 1.6,
    });

    this.roundText = this.add.text(headerX + 18, headerY + 44, "", {
      fontFamily: FONTS.body,
      fontSize: "13px",
      color: THEME.muted,
      letterSpacing: 0.8,
    });

    this.subtitleText = this.add.text(headerX + 18, headerY + 64, "", {
      fontFamily: FONTS.body,
      fontSize: "12px",
      color: THEME.muted,
    });

    this.scoreText = this.add.text(statsX + 16, statsY + 18, "Điểm: 0", {
      fontFamily: FONTS.body,
      fontSize: "16px",
      fontStyle: "700",
      color: THEME.text,
    });
    this.scoreText.setOrigin(0, 0);

    this.progressText = this.add.text(statsX + 16, statsY + 44, "", {
      fontFamily: FONTS.body,
      fontSize: "12px",
      color: THEME.muted,
    });
    this.progressText.setOrigin(0, 0);

    this.timerText = this.add.text(statsX + 16, statsY + 64, "", {
      fontFamily: FONTS.body,
      fontSize: "12px",
      color: THEME.muted,
    });
    this.timerText.setOrigin(0, 0);

    this.roofText = this.add.text(statusX + 16, statusY + 10, "Mái nhà: 50", {
      fontFamily: FONTS.body,
      fontSize: "12px",
      color: THEME.muted,
    });

    this.pillarBar = this.add.graphics();

    const startY = statusY + 34;
    const rowHeight = 18;
    const paddingX = 16;
    let labelWidth = Math.min(150, Math.max(110, Math.floor(statusWidth * 0.38)));
    let barArea = statusWidth - paddingX * 2 - labelWidth - 12;
    if (barArea < 100) {
      labelWidth = Math.max(90, statusWidth - paddingX * 2 - 12 - 100);
      barArea = statusWidth - paddingX * 2 - labelWidth - 12;
    }
    const barWidth = Math.max(90, Math.min(200, barArea));
    const barLeft = statusX + paddingX;
    const labelX = barLeft + barWidth + 12;
    const barHeight = 8;
    this.pillarLayout = { left: barLeft, barWidth, startY, barHeight, rowHeight };
    this.hudBottom = statusY + statusHeight + 18;

    (Object.entries(PILLARS) as [PillarKey, { label: string; color: number }][]).forEach(
      ([key, pillar], index) => {
        const labelY = startY + index * rowHeight + barHeight / 2;
        const label = this.add.text(labelX, labelY, pillar.label, {
          fontFamily: FONTS.body,
          fontSize: "10px",
          color: THEME.muted,
        });
        label.setOrigin(0, 0.5);
        label.setFixedSize(labelWidth, rowHeight);
        this.pillarLabels[key] = label;
        this.hudObjects.push(label);
      }
    );

    this.hudObjects.push(
      headerPanel,
      statsPanel,
      statusPanel,
      title,
      this.roundText,
      this.subtitleText,
      this.scoreText,
      this.progressText,
      this.timerText,
      this.roofText,
      this.pillarBar
    );
  }

  private renderLoading() {
    this.clearTransient();
    const { left, width } = this.getLayout();
    const panelY = this.getPanelTop(176);
    const panelHeight = 230;
    this.drawPanel(left, panelY, width, panelHeight);

    this.register(
      this.add.text(left + 32, panelY + 42, "Đang tải ngân hàng câu hỏi...", {
        fontFamily: FONTS.body,
        fontSize: "17px",
        color: THEME.text,
      })
    );
  }

  private async loadQuizBank() {
    const [round1, round2, round3] = await Promise.all([
      this.fetchRound("1"),
      this.fetchRound("2"),
      this.fetchRound("3"),
    ]);

    this.questionsByRound["1"] = round1.length ? round1 : FALLBACK_QUESTIONS["1"];
    this.questionsByRound["2"] = round2.length ? round2 : FALLBACK_QUESTIONS["2"];
    this.questionsByRound["3"] = round3.length ? round3 : FALLBACK_QUESTIONS["3"];

    this.startRound("1");
  }

  private async fetchRound(round: RoundKey): Promise<QuizQuestion[]> {
    try {
      const res = await fetch(`/api/questions?round=${round}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.questions)) {
        return [];
      }
      return data.questions as QuizQuestion[];
    } catch {
      return [];
    }
  }

  private startRound(round: RoundKey) {
    this.round = round;
    const config = ROUND_CONFIG[round];
    this.roundQuestions = this.prepareRound(round, config.targetCount);
    this.notifyLeaderboard(false);
    const tone = this.getTone();
    this.roundWash?.setFillStyle(tone.wash, 0.28);

    if (round === "2" && this.windPillar) {
      const candidates = this.questionsByRound["2"].filter(
        (question) => question.pillar === this.windPillar
      );
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        this.roundQuestions[0] = { ...pick, id: `${pick.id}-wind` };
      }
    }
    this.totalQuestions = this.roundQuestions.length;
    this.questionIndex = 0;
    this.roundCorrect = 0;
    this.roundNear = 0;
    this.roundWrong = 0;
    this.lastPenaltyReason = "";

    if (round === "3") {
      this.eliminationLives = 2;
    }

    this.updateHud();
    this.renderRoundIntro();
  }

  private prepareRound(round: RoundKey, targetCount: number) {
    const base = [...(this.questionsByRound[round] || [])];
    const shuffled = this.shuffle(base);
    if (shuffled.length === 0) return [];

    if (shuffled.length >= targetCount) {
      return shuffled.slice(0, targetCount);
    }

    const result: QuizQuestion[] = [...shuffled];
    let index = 0;
    while (result.length < targetCount) {
      const source = shuffled[index % shuffled.length];
      result.push({ ...source, id: `${source.id}-${result.length}` });
      index += 1;
    }
    return result;
  }

  private renderRoundIntro() {
    this.clearTransient();
    const tone = this.getTone();
    const { left, width } = this.getLayout();
    const panelY = this.getPanelTop(178);
    const panelHeight = 250;
    this.drawPanel(left, panelY, width, panelHeight, false, tone.accent);

    const config = ROUND_CONFIG[this.round];

    this.register(
      this.add.text(left + 32, panelY + 28, config.title, {
        fontFamily: FONTS.title,
        fontSize: "22px",
        color: toHex(tone.accent),
      })
    );

    this.register(
      this.add.text(left + 32, panelY + 70, config.subtitle, {
        fontFamily: FONTS.body,
        fontSize: "15px",
        color: THEME.text,
      })
    );

    this.register(
      this.add.text(
        left + 32,
        panelY + 110,
        "Mỗi lựa chọn là một viên gạch. Sai sẽ tạo vết nứt. Hãy giữ các trụ vững vàng.",
        {
          fontFamily: FONTS.body,
          fontSize: "15px",
          color: THEME.muted,
          wordWrap: { width: width - 64 },
        }
      )
    );

    this.createButton(left + 32, panelY + 170, 200, 48, "Bắt đầu", () => {
      this.renderQuestion();
    });
  }

  private renderQuestion() {
    this.clearTransient();
    this.inputLocked = false;
    this.updateHud();

    if (this.questionIndex >= this.roundQuestions.length) {
      if (this.round === "3" && !this.bossDone) {
        this.renderBossQuestion();
        return;
      }
      this.renderRoundSummary();
      return;
    }

    const question = this.roundQuestions[this.questionIndex];
    const tone = this.getTone();
    const { left, width } = this.getLayout();
    const sceneHeight = this.scale.height;
    const panelY = this.getPanelTop(168);
    const optionCount = question.options.length;
    const optionGap = 12;
    const optionHeight = 54;
    const optionBlock = optionCount * optionHeight + Math.max(0, optionCount - 1) * optionGap;
    const available = sceneHeight - panelY - 32;
    const panelHeight = Math.min(320, Math.max(180, available - optionBlock - 16));

    const panelGroup = this.add.container(0, 8);
    panelGroup.setAlpha(0);
    this.register(panelGroup);

    const panel = this.add.graphics();
    panel.fillStyle(THEME.panel, 1);
    panel.fillRoundedRect(left, panelY, width, panelHeight, 18);
    panel.lineStyle(1, tone.optionStroke, 1);
    panel.strokeRoundedRect(left, panelY, width, panelHeight, 18);
    panelGroup.add(panel);

    panelGroup.add(
      this.add.text(left + 28, panelY + 24, question.text, {
        fontFamily: FONTS.body,
        fontSize: "18px",
        color: THEME.text,
        wordWrap: { width: width - 56 },
        lineSpacing: 6,
      })
    );

    const pillarLabel = question.pillar ? `Trụ: ${PILLARS[question.pillar].label}` : "";
    if (pillarLabel) {
      panelGroup.add(
        this.add.text(left + 28, panelY + panelHeight - 34, pillarLabel, {
          fontFamily: FONTS.body,
          fontSize: "12px",
          color: THEME.muted,
        })
      );
    }

    const optionStartY = panelY + panelHeight + 16;
    question.options.forEach((option, index) => {
      const y = optionStartY + index * (optionHeight + optionGap);
      const box = this.register(
        this.add
          .rectangle(left, y, width, 54, tone.optionFill)
          .setOrigin(0)
          .setStrokeStyle(1, tone.optionStroke)
          .setInteractive({ useHandCursor: true })
      ) as Phaser.GameObjects.Rectangle;

      this.register(
        this.add.text(left + 20, y + 16, option, {
          fontFamily: FONTS.body,
          fontSize: "16px",
          color: THEME.text,
          wordWrap: { width: width - 40 },
        })
      );

      box.on("pointerover", () => box.setFillStyle(tone.optionHover));
      box.on("pointerout", () => box.setFillStyle(tone.optionFill));
      box.on("pointerup", () => {
        if (this.inputLocked) return;
        this.handleAnswer(index, panelGroup, question);
      });
    });

    this.tweens.add({
      targets: panelGroup,
      y: 0,
      alpha: 1,
      duration: 220,
      ease: "Sine.easeOut",
    });

    this.startTimer(question);
  }

  private renderBossQuestion() {
    this.clearTransient();
    this.inputLocked = false;

    const tone = this.getTone();
    const { left, width, height } = this.getLayout();
    const panelY = this.getPanelTop(168);
    const optionCount = BOSS_PROMPT.options.length;
    const optionGap = 12;
    const optionHeight = 54;
    const optionBlock = optionCount * optionHeight + Math.max(0, optionCount - 1) * optionGap;
    const available = height - panelY - 32;
    const panelHeight = Math.min(300, Math.max(180, available - optionBlock - 16));

    this.drawPanel(left, panelY, width, panelHeight, true, tone.accent);

    this.register(
      this.add.text(left + 28, panelY + 24, "Boss cuối", {
        fontFamily: FONTS.title,
        fontSize: "20px",
        color: toHex(tone.accent),
      })
    );

    this.register(
      this.add.text(left + 28, panelY + 64, BOSS_PROMPT.text, {
        fontFamily: FONTS.body,
        fontSize: "17px",
        color: THEME.text,
        wordWrap: { width: width - 56 },
      })
    );

    const optionStartY = panelY + panelHeight + 16;
    BOSS_PROMPT.options.forEach((option, index) => {
      const y = optionStartY + index * (optionHeight + optionGap);
      const box = this.register(
        this.add
          .rectangle(left, y, width, 54, tone.optionFill)
          .setOrigin(0)
          .setStrokeStyle(1, tone.optionStroke)
          .setInteractive({ useHandCursor: true })
      ) as Phaser.GameObjects.Rectangle;

      this.register(
        this.add.text(left + 20, y + 16, option, {
          fontFamily: FONTS.body,
          fontSize: "16px",
          color: THEME.text,
          wordWrap: { width: width - 40 },
        })
      );

      box.on("pointerover", () => box.setFillStyle(tone.optionHover));
      box.on("pointerout", () => box.setFillStyle(tone.optionFill));
      box.on("pointerup", () => {
        if (this.inputLocked) return;
        this.inputLocked = true;
        const isCorrect = index === BOSS_PROMPT.correctIndex;
        const delta = isCorrect ? BOSS_PROMPT.points : -2;
        this.score = Math.max(0, this.score + delta);
        this.updateHud();
        this.notifyScore(this.score);
        const kind: AnswerKind = isCorrect ? "correct" : "wrong";
        this.showFeedback(kind, BOSS_PROMPT.explanation || "", () => {
          this.bossDone = true;
          this.renderRoundSummary();
        });
      });
    });

    this.timerText?.setText("Boss: 60s thảo luận nhóm");
  }

  private handleAnswer(index: number, panelGroup: Phaser.GameObjects.Container, question: QuizQuestion) {
    if (this.inputLocked) return;
    this.inputLocked = true;
    this.stopTimer();

    const isCorrect = index === question.correctIndex;
    const timedOut = index < 0;
    const isNear =
      !isCorrect &&
      index >= 0 &&
      Array.isArray(question.nearCorrect) &&
      question.nearCorrect.includes(index);
    const answerKind: AnswerKind = isCorrect ? "correct" : isNear ? "near" : "wrong";
    const roundConfig = ROUND_CONFIG[this.round];
    const basePoints = Number.isFinite(question.points) ? question.points : 1;
    const nearPoints = Number.isFinite(question.nearPoints ?? NaN)
      ? Math.max(0, Math.round(question.nearPoints as number))
      : Math.max(0, Math.round(basePoints * 0.5));
    const nearMessage =
      question.consequenceNear ?? "Gần đúng, nhưng thiếu một trụ quan trọng.";

    let deltaScore = 0;
    let consequence = "";
    let speedBonus = 0;

    if (this.round === "1") {
      if (answerKind === "correct") {
        deltaScore = basePoints;
      } else if (answerKind === "near") {
        deltaScore = Math.max(1, nearPoints);
      } else {
        deltaScore = -1;
      }
      consequence =
        answerKind === "correct"
          ? question.explanation || "Trụ được gia cố thêm một lớp gạch."
          : answerKind === "near"
            ? nearMessage
            : "Vết nứt xuất hiện trên nền móng.";
    } else if (this.round === "2") {
      if (answerKind === "correct") {
        deltaScore = basePoints + 1;
      } else if (answerKind === "near") {
        deltaScore = Math.max(0, nearPoints);
      } else {
        deltaScore = question.riskPenalty ?? -2;
      }
      consequence =
        answerKind === "correct"
          ? question.consequenceCorrect || "Gia đình giữ được sự ổn định trước mắt."
          : answerKind === "near"
            ? question.consequenceNear || "Gần đúng nhưng thiếu một trụ quan trọng."
            : question.consequenceWrong || "Một hệ quả rủi ro khiến trụ yếu đi.";
    } else {
      if (answerKind === "correct") {
        const timeLimit = question.timeLimitSec ?? roundConfig.timeLimitSec;
        const elapsed = Math.max(0, (this.time.now - this.questionStartTime) / 1000);
        speedBonus = Math.max(0, Math.ceil(((timeLimit - elapsed) / timeLimit) * 3));
        deltaScore = basePoints + speedBonus;
        consequence = speedBonus > 0 ? `Bứt tốc +${speedBonus} điểm!` : "Phản xạ ổn.";
      } else if (answerKind === "near") {
        deltaScore = Math.max(1, nearPoints);
        consequence = question.consequenceNear || "Gần đúng, tốc độ chưa đủ để bứt phá.";
      } else {
        deltaScore = -2;
        this.eliminationLives = Math.max(0, this.eliminationLives - 1);
        consequence = "Sai nhịp! Bạn mất 1 mạng trong vòng tốc độ.";
      }
    }

    if (answerKind === "correct") {
      this.correctStreak += 1;
    } else {
      this.correctStreak = 0;
    }

    this.score = Math.max(0, this.score + deltaScore);
    this.updatePillars(question, answerKind);
    this.updateHud();
    this.notifyScore(this.score);

    if (answerKind === "wrong") {
      if (this.round === "3") {
        this.lastPenaltyReason = timedOut
          ? "Hết thời gian ở vòng tốc độ."
          : "Chọn sai ở vòng tốc độ.";
      } else if (this.round === "2") {
        this.lastPenaltyReason =
          question.consequenceWrong ?? "Lựa chọn rủi ro làm trụ yếu đi.";
      } else {
        this.lastPenaltyReason = timedOut ? "Hết thời gian." : "Trả lời sai làm nền móng nứt.";
      }
      this.tweens.add({
        targets: panelGroup,
        x: panelGroup.x + 6,
        duration: 60,
        yoyo: true,
        repeat: 3,
      });
    }

    const badge =
      deltaScore >= 0
        ? `${deltaScore > 0 ? "+" : ""}${deltaScore} điểm`
        : `${deltaScore} điểm`;
    const finalMessage = `${badge}\n${consequence}`;

    this.showFeedback(answerKind, finalMessage, () => {
      if (answerKind === "wrong") {
        this.roundWrong += 1;
      } else if (answerKind === "near") {
        this.roundNear += 1;
      } else {
        this.roundCorrect += 1;
      }

      if (this.round === "1" && (this.questionIndex + 1) % 10 === 0) {
        this.questionIndex += 1;
        this.renderCheckpoint();
        return;
      }

      if (this.round === "3" && this.eliminationLives === 0) {
        this.renderEliminated();
        return;
      }

      this.questionIndex += 1;
      this.renderQuestion();
    }, this.correctStreak);
  }

  private renderCheckpoint() {
    this.clearTransient();
    const tone = this.getTone();
    const weakest = this.getWeakestPillar();
    this.windPillar = weakest;

    const { left, width } = this.getLayout();
    const panelY = this.getPanelTop(170);
    const panelHeight = 220;
    this.drawPanel(left, panelY, width, panelHeight, true, tone.accent);

    this.register(
      this.add.text(left + 32, panelY + 32, "Gió lắc trụ yếu", {
        fontFamily: FONTS.title,
        fontSize: "20px",
        color: toHex(tone.accent),
      })
    );

    this.register(
      this.add.text(
        left + 32,
        panelY + 74,
        `Trụ yếu nhất hiện tại: ${PILLARS[weakest].label}. Vòng 2 sẽ thử thách trụ này.`,
        {
          fontFamily: FONTS.body,
          fontSize: "16px",
          color: THEME.text,
          wordWrap: { width: width - 64 },
        }
      )
    );

    this.createButton(left + 32, panelY + 150, 220, 48, "Tiếp tục", () => {
      this.renderQuestion();
    });
  }

  private renderEliminated() {
    this.clearTransient();
    this.notifyLeaderboard(true);
    this.notifyEnding("eliminated");

    const tone = this.getTone();
    const { left, width, height } = this.getLayout();
    const panelY = this.getPanelTop(170);
    const panelHeight = 240;
    this.drawPanel(left, panelY, width, panelHeight, true, tone.accent);

    this.register(
      this.add.text(left + 32, panelY + 26, "Trời phạt", {
        fontFamily: FONTS.title,
        fontSize: "22px",
        color: toHex(THEME.danger),
      })
    );

    const weakest = this.getWeakestPillar();
    const reasonLine = this.lastPenaltyReason || "Mất hết 2 mạng ở vòng tốc độ.";
    this.register(
      this.add.text(
        left + 32,
        panelY + 62,
        `Bạn bị loại.\nLý do: ${reasonLine}\nTrụ yếu nhất: ${PILLARS[weakest].label}. Trời phạt để nhắc giữ vững nền tảng.`,
        {
          fontFamily: FONTS.body,
          fontSize: "15px",
          color: THEME.text,
          wordWrap: { width: width - 180 },
          lineSpacing: 6,
        }
      )
    );

    const skeletonX = left + width - 120;
    const skeletonY = panelY + panelHeight - 50;
    const skeleton = this.createSkeleton(skeletonX, skeletonY, 1);

    this.tweens.add({
      targets: skeleton,
      angle: { from: -6, to: 6 },
      duration: 120,
      yoyo: true,
      repeat: 5,
      ease: "Sine.easeInOut",
    });

    this.triggerPunishment(width, height, skeletonX, panelY + 36, skeletonY - 20);
    this.time.delayedCall(260, () => {
      this.triggerPunishment(width, height, skeletonX + 10, panelY + 36, skeletonY - 12);
    });

    this.createButton(left + 32, panelY + 150, 200, 48, "Chơi lại", () => {
      this.resetGame();
      this.startRound("1");
    });
  }

  private renderRoundSummary() {
    this.clearTransient();
    const tone = this.getTone();
    const { left, width } = this.getLayout();
    const panelY = this.getPanelTop(168);
    const panelHeight = 270;
    this.drawPanel(left, panelY, width, panelHeight, true, tone.accent);

    const config = ROUND_CONFIG[this.round];

    const summaryTitle =
      this.round === "3"
        ? "Viên mãn hôn nhân"
        : `${config.title} – Hoàn thành`;

    this.register(
      this.add.text(left + 32, panelY + 28, summaryTitle, {
        fontFamily: FONTS.title,
        fontSize: "20px",
        color: toHex(tone.accent),
      })
    );

    this.register(
      this.add.text(
        left + 32,
        panelY + 68,
        `Đúng: ${this.roundCorrect} | Gần đúng: ${this.roundNear} | Sai: ${this.roundWrong} | Điểm: ${this.score}`,
        {
          fontFamily: FONTS.body,
          fontSize: "15px",
          color: THEME.text,
        }
      )
    );

    const weakest = this.getWeakestPillar();
    this.register(
      this.add.text(
        left + 32,
        panelY + 104,
        `Trụ cần củng cố: ${PILLARS[weakest].label}.`,
        {
          fontFamily: FONTS.body,
          fontSize: "15px",
          color: THEME.muted,
        }
      )
    );

    if (this.round === "3") {
      this.notifyLeaderboard(true);
      this.notifyEnding("completed");
      this.register(
        this.add.text(
          left + 32,
          panelY + 140,
          "Bạn đã hoàn thành hành trình và hiểu nền tảng xây dựng gia đình. Chúc bạn viên mãn trong hôn nhân.",
          {
            fontFamily: FONTS.body,
            fontSize: "15px",
            color: THEME.text,
            wordWrap: { width: width - 64 },
          }
        )
      );

      this.createButton(left + 32, panelY + 200, 200, 48, "Chơi lại", () => {
        this.resetGame();
        this.startRound("1");
      });
      return;
    }

    const nextRound: RoundKey = this.round === "1" ? "2" : "3";
    this.createButton(left + 32, panelY + 190, 220, 48, "Sang vòng tiếp", () => {
      this.startRound(nextRound);
    });
  }

  private resetGame() {
    this.score = 0;
    this.pillarScores = { economy: 50, politics: 50, law: 50, culture: 50 };
    this.windPillar = null;
    this.roundCorrect = 0;
    this.roundNear = 0;
    this.roundWrong = 0;
    this.bossDone = false;
    this.correctStreak = 0;
    this.lastPenaltyReason = "";
    this.updateHud();
    this.notifyScore(0);
    this.notifyLeaderboard(false);
  }

  private updatePillars(question: QuizQuestion, kind: AnswerKind) {
    if (!question.pillar) return;
    const pillar = question.pillar;
    let delta = 0;

    if (this.round === "1") {
      delta = kind === "correct" ? 7 : kind === "near" ? 2 : -10;
    } else if (this.round === "2") {
      delta = kind === "correct" ? 6 : kind === "near" ? 1 : -9;
    } else {
      delta = kind === "correct" ? 4 : kind === "near" ? 1 : -7;
    }

    if (this.windPillar && this.windPillar === pillar && kind !== "correct") {
      delta -= kind === "near" ? 2 : 4;
    }

    const next = Phaser.Math.Clamp(this.pillarScores[pillar] + delta, 0, 100);
    this.pillarScores[pillar] = next;
  }

  private updateHud() {
    const config = ROUND_CONFIG[this.round];
    const tone = this.getTone();
    this.roundText?.setText(config.title.toUpperCase());
    this.roundText?.setColor(toHex(tone.accent));
    this.subtitleText?.setText(config.subtitle);
    this.subtitleText?.setColor(toHex(tone.soft));
    this.scoreText?.setText(`Điểm: ${this.score}`);
    this.progressText?.setText(
      `Câu: ${Math.min(this.questionIndex + 1, this.totalQuestions)}/${this.totalQuestions}`
    );

    const roofScore = Math.round(
      (this.pillarScores.economy +
        this.pillarScores.politics +
        this.pillarScores.law +
        this.pillarScores.culture) /
        4
    );
    this.roofText?.setText(`Mái nhà: ${roofScore}`);

    if (this.pillarBar) {
      this.drawPillars(this.pillarBar);
    }
  }

  private drawPillars(graphics: Phaser.GameObjects.Graphics) {
    graphics.clear();
    if (!this.pillarLayout) return;

    const { left, barWidth, startY, barHeight, rowHeight } = this.pillarLayout;

    (Object.entries(PILLARS) as [PillarKey, { label: string; color: number }][]).forEach(
      ([key, pillar], index) => {
        const y = startY + index * rowHeight;
        graphics.fillStyle(0xffffff, 0.7);
        graphics.fillRoundedRect(left, y, barWidth, barHeight, 4);
        graphics.fillStyle(pillar.color, 0.95);
        graphics.fillRoundedRect(
          left,
          y,
          (this.pillarScores[key] / 100) * barWidth,
          barHeight,
          4
        );
        graphics.lineStyle(1, THEME.panelStroke, 1);
        graphics.strokeRoundedRect(left, y, barWidth, barHeight, 4);
      }
    );
  }

  private startTimer(question: QuizQuestion) {
    this.stopTimer();
    const config = ROUND_CONFIG[this.round];
    let timeLeft = question.timeLimitSec ?? config.timeLimitSec;
    this.questionStartTime = this.time.now;
    this.timerText?.setText(`Thời gian: ${timeLeft}s`);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        timeLeft -= 1;
        this.timerText?.setText(`Thời gian: ${Math.max(timeLeft, 0)}s`);
        if (timeLeft <= 0) {
          this.stopTimer();
          if (!this.inputLocked) {
            this.inputLocked = true;
            this.handleTimeout(question);
          }
        }
      },
    });
  }

  private handleTimeout(question: QuizQuestion) {
    const panelGroup = this.add.container(0, 0);
    this.register(panelGroup);
    this.handleAnswer(-1, panelGroup, question);
  }

  private stopTimer() {
    if (this.timerEvent) {
      this.timerEvent.remove(false);
      this.timerEvent = undefined;
    }
  }

  private showFeedback(
    kind: AnswerKind,
    message: string,
    onContinue: () => void,
    streak = 0
  ) {
    const { left, width, height } = this.getLayout();
    const panelY = height - 210;
    const panelHeight = 150;
    const tone = this.getTone();
    const isPositive = kind !== "wrong";

    const overlay = this.register(
      this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.25).setOrigin(0)
    ) as Phaser.GameObjects.Rectangle;

    this.drawPanel(left, panelY, width, panelHeight, true, tone.accent);

    const flashColor =
      kind === "correct" ? 0xe8f7ef : kind === "near" ? 0xfaf1e6 : 0xf7e8e8;
    const flash = this.register(
      this.add.rectangle(left, panelY, width, panelHeight, flashColor, 0.6).setOrigin(0)
    ) as Phaser.GameObjects.Rectangle;
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 380,
      ease: "Sine.easeOut",
    });

    const outline = this.register(this.add.graphics());
    const outlineColor =
      kind === "correct" ? THEME.success : kind === "near" ? THEME.accent : THEME.danger;
    outline.lineStyle(2, outlineColor, 0.8);
    outline.strokeRoundedRect(left + 6, panelY + 6, width - 12, panelHeight - 12, 14);
    this.tweens.add({
      targets: outline,
      alpha: 0,
      duration: 520,
      ease: "Sine.easeOut",
    });

    const title = kind === "correct" ? "Gạch vững" : kind === "near" ? "Gần đúng" : "Vết nứt";
    const color = toHex(outlineColor);

    this.register(
      this.add.text(left + 28, panelY + 18, title, {
        fontFamily: FONTS.title,
        fontSize: "19px",
        color,
      })
    );

    this.register(
      this.add.text(left + 28, panelY + 52, message, {
        fontFamily: FONTS.body,
        fontSize: "15px",
        color: THEME.text,
        wordWrap: { width: width - 56 },
      })
    );

    if (isPositive) {
      const sparkleColor = kind === "correct" ? THEME.success : THEME.accent;
      this.spawnSparkles(left + width - 90, panelY + 28, sparkleColor);
      this.spawnFeedbackBurst(left + width - 80, panelY + 32, sparkleColor);
      if (kind === "correct" && streak >= 3) {
        this.triggerStreakEffect(streak, left + width * 0.65, panelY - 12);
      }
    } else {
      this.spawnCracks(left + 24, panelY + 30, width * 0.32, panelHeight * 0.5, THEME.danger);
      this.spawnFeedbackBurst(left + 80, panelY + 32, THEME.danger);
      this.cameras.main.shake(140, 0.0035);
    }

    this.createButton(left + width - 170, panelY + 104, 140, 40, "Tiếp tục", () => {
      overlay.destroy();
      onContinue();
    });
  }

  private spawnFeedbackBurst(x: number, y: number, color: number) {
    for (let i = 0; i < 7; i += 1) {
      const dot = this.register(
        this.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.9)
      ) as Phaser.GameObjects.Arc;
      const angle = Phaser.Math.FloatBetween(-Math.PI / 3, (4 * Math.PI) / 3);
      const distance = Phaser.Math.Between(18, 38);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.4,
        duration: 420,
        ease: "Sine.easeOut",
        onComplete: () => dot.destroy(),
      });
    }
  }

  private spawnSparkles(x: number, y: number, color: number) {
    for (let i = 0; i < 10; i += 1) {
      const sparkle = this.register(
        this.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.9)
      ) as Phaser.GameObjects.Arc;
      const angle = Phaser.Math.FloatBetween(-Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6);
      const distance = Phaser.Math.Between(20, 42);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.4,
        duration: 520,
        ease: "Sine.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private spawnCracks(x: number, y: number, width: number, height: number, color: number) {
    const crack = this.register(this.add.graphics());
    crack.lineStyle(2, color, 0.55);
    const startX = x + width * 0.1;
    const startY = y + height * 0.2;
    crack.beginPath();
    crack.moveTo(startX, startY);
    let cx = startX;
    let cy = startY;
    for (let i = 0; i < 6; i += 1) {
      cx += Phaser.Math.Between(18, 32);
      cy += Phaser.Math.Between(10, 26);
      crack.lineTo(cx, cy);
    }
    crack.strokePath();
    this.tweens.add({
      targets: crack,
      alpha: 0,
      duration: 600,
      ease: "Sine.easeOut",
      onComplete: () => crack.destroy(),
    });
  }

  private triggerStreakEffect(streak: number, x: number, y: number) {
    const label = this.register(
      this.add.text(x, y, `THĂNG HOA x${streak}`, {
        fontFamily: FONTS.title,
        fontSize: "16px",
        color: toHex(THEME.success),
      })
    ) as Phaser.GameObjects.Text;
    label.setOrigin(0.5, 0.5);
    label.setDepth(180);

    this.tweens.add({
      targets: label,
      y: y - 24,
      alpha: 0,
      duration: 900,
      ease: "Sine.easeOut",
      onComplete: () => label.destroy(),
    });

    for (let i = 0; i < 12; i += 1) {
      const spark = this.register(
        this.add.circle(x, y, Phaser.Math.Between(2, 4), THEME.success, 0.9)
      ) as Phaser.GameObjects.Arc;
      spark.setDepth(175);
      const angle = Phaser.Math.FloatBetween(-Math.PI / 2 - 0.8, -Math.PI / 2 + 0.8);
      const distance = Phaser.Math.Between(26, 52);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.3,
        duration: 700,
        ease: "Sine.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  private getWeakestPillar(): PillarKey {
    const entries = Object.entries(this.pillarScores) as [PillarKey, number][];
    entries.sort((a, b) => a[1] - b[1]);
    return entries[0][0];
  }

  private getLayout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const paddingX = Math.max(48, Math.floor(width * 0.08));
    const contentWidth = Math.min(880, width - paddingX * 2);
    const left = Math.floor((width - contentWidth) / 2);
    return { left, width: contentWidth, height };
  }

  private getPanelTop(defaultY: number) {
    return Math.max(defaultY, this.hudBottom);
  }

  private getTone() {
    return ROUND_TONES[this.round];
  }

  private register<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.transientObjects.push(obj);
    return obj;
  }

  private clearTransient() {
    this.transientObjects.forEach((obj) => obj.destroy());
    this.transientObjects = [];
  }

  private createBackdrop(width: number, height: number) {
    if (this.backgroundObjects.length > 0) return;

    const hazeOne = this.add
      .circle(width * 0.18, height * 0.2, Math.min(width, height) * 0.35, THEME.backgroundAccent)
      .setAlpha(0.45);
    hazeOne.setBlendMode(Phaser.BlendModes.SCREEN);

    const hazeTwo = this.add
      .circle(width * 0.85, height * 0.15, Math.min(width, height) * 0.25, THEME.panelAlt)
      .setAlpha(0.35);
    hazeTwo.setBlendMode(Phaser.BlendModes.SCREEN);

    const hazeThree = this.add
      .circle(width * 0.75, height * 0.82, Math.min(width, height) * 0.3, THEME.panelAlt)
      .setAlpha(0.25);
    hazeThree.setBlendMode(Phaser.BlendModes.SCREEN);

    this.backgroundObjects.push(hazeOne, hazeTwo, hazeThree);

    const ribbon = this.add.graphics();
    ribbon.fillStyle(THEME.panelStroke, 0.2);
    ribbon.fillRoundedRect(width * 0.08, height * 0.17, width * 0.32, 6, 3);
    this.backgroundObjects.push(ribbon);

    const rings = this.add.graphics();
    rings.lineStyle(2, THEME.accentSoft, 0.35);
    rings.strokeCircle(width * 0.86, height * 0.18, 54);
    rings.strokeCircle(width * 0.91, height * 0.22, 54);
    this.backgroundObjects.push(rings);

    const petals: Phaser.GameObjects.Ellipse[] = [];
    for (let i = 0; i < 10; i += 1) {
      const petal = this.add
        .ellipse(
          width * (0.15 + i * 0.07),
          height * (0.08 + (i % 2) * 0.03),
          14,
          24,
          THEME.buttonFill,
          0.35
        )
        .setAngle(20 + i * 8) as Phaser.GameObjects.Ellipse;
      petals.push(petal);
      this.backgroundObjects.push(petal);
    }

    petals.forEach((petal, index) => {
      this.tweens.add({
        targets: petal,
        y: petal.y + (index % 2 === 0 ? 6 : -6),
        angle: petal.angle + (index % 2 === 0 ? 4 : -4),
        duration: 3200 + index * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    const dots = this.add.graphics();
    dots.fillStyle(THEME.panelStroke, 0.25);
    const dotStartX = Math.max(40, width * 0.08);
    const dotEndX = width - dotStartX;
    for (let x = dotStartX; x < dotEndX; x += 26) {
      dots.fillCircle(x, height - 40, 2.2);
    }
    this.backgroundObjects.push(dots);

    this.placeFamilyArt(width, height);
    this.placeDecorArt(width, height);
    this.createStormEffects(width, height);
  }

  private placeFamilyArt(width: number, height: number) {
    if (!this.textures.exists("family")) return;
    const image = this.add.image(width * 0.84, height * 0.93, "family");
    const scale = Math.min(width / 1200, height / 800) * 0.9;
    image.setOrigin(0.5, 1);
    image.setScale(scale);
    image.setAlpha(0.45);
    image.setDepth(0);
    this.backgroundObjects.push(image);
  }

  private placeDecorArt(width: number, height: number) {
    if (this.textures.exists("house")) {
      const house = this.add.image(width * 0.18, height * 0.92, "house");
      const scale = Math.min(width / 1300, height / 900) * 0.75;
      house.setOrigin(0.5, 1);
      house.setScale(scale);
      house.setAlpha(0.35);
      house.setDepth(0);
      this.backgroundObjects.push(house);
    }

    if (this.textures.exists("rings")) {
      const rings = this.add.image(width * 0.88, height * 0.24, "rings");
      const scale = Math.min(width / 1100, height / 800) * 0.7;
      rings.setOrigin(0.5, 0.5);
      rings.setScale(scale);
      rings.setAlpha(0.35);
      rings.setDepth(0);
      this.backgroundObjects.push(rings);
    }

    if (this.textures.exists("hearts")) {
      const hearts = this.add.image(width * 0.22, height * 0.18, "hearts");
      const scale = Math.min(width / 1200, height / 900) * 0.6;
      hearts.setOrigin(0.5, 0.5);
      hearts.setScale(scale);
      hearts.setAlpha(0.35);
      hearts.setDepth(0);
      this.backgroundObjects.push(hearts);
    }
  }

  private createStormEffects(width: number, height: number) {
    const cloudColor = 0xcab9ad;
    const cloudAlpha = 0.35;
    const cloudRows = [0.08, 0.14, 0.2];

    cloudRows.forEach((row, index) => {
      const cloud = this.add.container(0, 0);
      const baseY = height * row;
      const baseX = width * (0.15 + index * 0.25);

      for (let i = 0; i < 4; i += 1) {
        const blob = this.add
          .ellipse(baseX + i * 30, baseY + (i % 2) * 6, 80, 40, cloudColor, cloudAlpha)
          .setOrigin(0.5);
        cloud.add(blob);
      }

      cloud.setAlpha(0.4);
      cloud.setDepth(1);
      cloud.setData("homeX", cloud.x);
      cloud.setData("homeY", cloud.y);
      cloud.setData("homeScale", 1);
      this.stormClouds.push(cloud);
      this.backgroundObjects.push(cloud);

      this.tweens.add({
        targets: cloud,
        x: width * 0.1 + index * 40,
        duration: 9000 + index * 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    this.lightningLayer = this.add.graphics();
    this.lightningLayer.setDepth(120);
    this.lightningLayer.setAlpha(0);

    this.stormDim = this.add
      .rectangle(0, 0, width, height, 0x2b1f1a, 0)
      .setOrigin(0)
      .setDepth(118);

    this.lightningFlash = this.add
      .rectangle(0, 0, width, height, 0xffffff, 0)
      .setOrigin(0)
      .setDepth(130);

    const scheduleStrike = () => {
      const delay = Phaser.Math.Between(3500, 9000);
      this.stormTimer = this.time.addEvent({
        delay,
        callback: () => {
          this.triggerLightning(width, height);
          scheduleStrike();
        },
      });
    };
    scheduleStrike();
  }

  private triggerLightning(width: number, height: number) {
    if (!this.lightningLayer || !this.lightningFlash) return;
    const startX = Phaser.Math.Between(Math.floor(width * 0.2), Math.floor(width * 0.8));
    const maxY = Math.floor(height * 0.55);

    if (this.stormDim) {
      this.tweens.add({
        targets: this.stormDim,
        alpha: 0.22,
        duration: 220,
        ease: "Sine.easeInOut",
        yoyo: true,
      });
    }

    this.chargeStorm(startX, 260);

    this.lightningLayer.clear();
    this.lightningLayer.lineStyle(2, 0xf9f2ea, 0.9);
    this.lightningLayer.beginPath();
    this.lightningLayer.moveTo(startX, 0);

    let x = startX;
    let y = 0;
    while (y < maxY) {
      x += Phaser.Math.Between(-30, 30);
      y += Phaser.Math.Between(26, 54);
      this.lightningLayer.lineTo(x, y);
    }
    this.lightningLayer.strokePath();
    this.lightningLayer.setAlpha(1);

    this.lightningFlash.setAlpha(0.7);

    this.cameras.main.shake(220, 0.004);

    this.tweens.add({
      targets: this.lightningLayer,
      alpha: 0,
      duration: 320,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: this.lightningFlash,
      alpha: 0,
      duration: 400,
      ease: "Sine.easeOut",
    });

    this.disperseStorm(520);
  }

  private chargeStorm(strikeX: number, duration: number) {
    if (this.stormClouds.length === 0) return;
    this.stormClouds.forEach((cloud, index) => {
      const offset = (index - 1) * 40;
      this.tweens.add({
        targets: cloud,
        x: strikeX + offset,
        alpha: 0.7,
        scale: 1.08,
        duration,
        ease: "Sine.easeInOut",
      });
    });
  }

  private disperseStorm(duration: number) {
    if (this.stormClouds.length === 0) return;
    this.stormClouds.forEach((cloud) => {
      const homeX = cloud.getData("homeX") as number | undefined;
      const homeScale = cloud.getData("homeScale") as number | undefined;
      this.tweens.add({
        targets: cloud,
        x: homeX ?? 0,
        alpha: 0.4,
        scale: homeScale ?? 1,
        duration,
        ease: "Sine.easeInOut",
      });
    });
  }

  private triggerPunishment(
    width: number,
    height: number,
    strikeX: number,
    strikeStartY: number,
    strikeEndY: number
  ) {
    this.triggerLightning(width, height);
    if (this.lightningFlash) {
      this.lightningFlash.setAlpha(0.85);
      this.tweens.add({
        targets: this.lightningFlash,
        alpha: 0,
        duration: 500,
        ease: "Sine.easeOut",
      });
    }

    const strike = this.register(this.add.graphics());
    strike.lineStyle(3, 0xf7f1ea, 1);
    strike.beginPath();
    strike.moveTo(strikeX, strikeStartY);
    let x = strikeX;
    let y = strikeStartY;
    while (y < strikeEndY) {
      x += Phaser.Math.Between(-16, 16);
      y += Phaser.Math.Between(18, 38);
      strike.lineTo(x, y);
    }
    strike.strokePath();

    this.cameras.main.shake(220, 0.007);

    this.tweens.add({
      targets: strike,
      alpha: 0,
      duration: 260,
      ease: "Sine.easeOut",
      onComplete: () => strike.destroy(),
    });
  }

  private createSkeleton(x: number, y: number, scale = 1) {
    const container = this.register(this.add.container(x, y));
    const g = this.add.graphics();
    g.lineStyle(2, 0x4b3b33, 0.9);

    const s = scale;
    g.strokeCircle(0, -28 * s, 12 * s);
    g.lineBetween(0, -16 * s, 0, 26 * s);
    g.lineBetween(-14 * s, -6 * s, 14 * s, -6 * s);
    g.lineBetween(-12 * s, 4 * s, 0, 10 * s);
    g.lineBetween(12 * s, 4 * s, 0, 10 * s);

    for (let i = -2; i <= 2; i += 1) {
      g.lineBetween(-8 * s, (i * 6 + 4) * s, 8 * s, (i * 6 + 4) * s);
    }

    g.lineBetween(0, 26 * s, -10 * s, 46 * s);
    g.lineBetween(0, 26 * s, 10 * s, 46 * s);

    container.add(g);
    return container;
  }

  private drawPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    alt = false,
    accentColor?: number
  ) {
    const shadow = this.register(this.add.graphics());
    shadow.fillStyle(0x000000, 0.12);
    shadow.fillRoundedRect(x + 4, y + 4, width, height, 18);

    const panel = this.register(this.add.graphics());
    panel.fillStyle(alt ? THEME.panelAlt : THEME.panel, 1);
    panel.fillRoundedRect(x, y, width, height, 18);
    panel.lineStyle(1, THEME.panelStroke, 1);
    panel.strokeRoundedRect(x, y, width, height, 18);

    const accent = this.register(this.add.graphics());
    accent.fillStyle(accentColor ?? THEME.buttonFill, 0.6);
    accent.fillCircle(x + 18, y + 18, 4);
    accent.fillCircle(x + width - 18, y + 18, 4);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void
  ) {
    const tone = this.getTone();
    const box = this.register(
      this.add
        .rectangle(x, y, width, height, tone.optionFill)
        .setOrigin(0)
        .setStrokeStyle(1, tone.optionStroke)
        .setInteractive({ useHandCursor: true })
    ) as Phaser.GameObjects.Rectangle;

    const text = this.register(
      this.add.text(x + width / 2, y + height / 2, label, {
        fontFamily: FONTS.body,
        fontSize: "16px",
        color: THEME.text,
        fontStyle: "700",
      })
    ) as Phaser.GameObjects.Text;
    text.setOrigin(0.5);

    box.on("pointerover", () => {
      box.setFillStyle(tone.optionHover);
    });
    box.on("pointerout", () => {
      box.setFillStyle(tone.optionFill);
    });
    box.on("pointerup", onClick);
  }

  private shuffle<T>(items: T[]) {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private notifyScore(score: number) {
    if (typeof window === "undefined") return;
    const totalTimeMs = Math.max(0, this.time.now - this.startTime);
    window.dispatchEvent(
      new CustomEvent("game:score", { detail: { score, totalTimeMs } })
    );
  }

  private notifyLeaderboard(show: boolean) {
    if (typeof window === "undefined") return;
    const eventName = show ? "game:leaderboard" : "game:leaderboard-hide";
    window.dispatchEvent(new CustomEvent(eventName));
  }

  private notifyEnding(status: "completed" | "eliminated") {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("game:ending", { detail: { status } }));
  }
}
