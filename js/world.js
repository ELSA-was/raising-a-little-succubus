/* =========================================================================
   《养成一个小魅魔》 —— 世界常量：背景、角色、阶段、数值
   ========================================================================= */

/* 背景键 -> 资产文件名（缺失则引用同键占位，已在 prep_bg 中生成） */
export const BG = {
  apartment_day:   'assets/bg/bg_apartment.jpg',
  apartment_night: 'assets/bg/bg_apartment.jpg',
  bedroom_night:   'assets/bg/bg_bedroom.jpg',
  studio:          'assets/bg/bg_studio.jpg',
  bar_night:       'assets/bg/bg_bar.jpg',
  hospital:        'assets/bg/bg_hospital.jpg',
  stage:           'assets/bg/bg_stage.jpg',
  cafe_day:        'assets/bg/bg_cafe.jpg',
  street_autumn:   'assets/bg/bg_street.jpg',
  store_night:     'assets/bg/bg_store.jpg',
  rooftop_night:   'assets/bg/bg_rooftop.jpg',
  snow_night:      'assets/bg/bg_snow.jpg',
  riverside_dusk:  'assets/bg/bg_riverside.jpg',
  darkroom:        'assets/bg/bg_darkroom.jpg',
  greenhouse:      'assets/bg/bg_greenhouse.jpg',
  citynight:       'assets/bg/bg_citynight.jpg',
  rainwindow:      'assets/bg/bg_rainwindow.jpg',
  nightriver:      'assets/bg/bg_nightriver.jpg'
};

/* 角色：用于名字牌、状态栏与立绘基色 */
export const CHARS = {
  silas:     { name: '塞拉斯', color: '#c9a6ff' },
  silas_teen:{ name: '塞拉斯', color: '#c9a6ff' },
  silas_child:{ name: '塞拉斯', color: '#c9a6ff' },
  lucien:    { name: '路西恩', color: '#d9c27a' },
  guhuai:    { name: '顾淮',   color: '#7fb6d6' },
  shenyan:   { name: '沈砚',   color: '#86d6a4' },
  jiangyu:   { name: '江屿',   color: '#ff9a8b' },
  huoqing:   { name: '霍青',   color: '#e0a3a3' },
  xuyuan:    { name: '许沅',   color: '#ffd1e8' },
  suwan:     { name: '苏晚',   color: '#ffc06f' },
  item_egg:  { name: '神秘之蛋', color: '#f0a6c9' }
};

/* 成长阶段（用于状态栏文案与阶段门槛） */
export const STAGES = {
  egg:    '蛋期',
  child:  '幼儿期',
  teen:   '成长期',
  mature: '成熟期'
};

/* 攻略对象好感键 */
export const ROUTE_KEYS = ['silas', 'guhuai', 'shenyan', 'jiangyu', 'huoqing'];

/* 进入某条路线的好感门槛 */
export const ROUTE_GATE = {
  silas:   35,
  guhuai:  45,
  shenyan: 45,
  jiangyu: 45,
  huoqing: 45
};

/* 路线 -> 起始节点 */
export const ROUTE_START = {
  silas:   'r_silas_1',
  guhuai:  'r_guhuai_1',
  shenyan: 'r_shenyan_1',
  jiangyu: 'r_jiangyu_1',
  huoqing: 'r_huoqing_1'
};

/* 路线元信息（用于 Hub 展示） */
export const ROUTE_META = {
  silas:   { title: '塞拉斯线', sub: '你亲手养大的小魅魔', emoji: '🜲' },
  guhuai:  { title: '顾淮线',   sub: '镜头后面的暴君',     emoji: '📷' },
  shenyan: { title: '沈砚线',   sub: '住 2306 的沈医生',  emoji: '🩺' },
  jiangyu: { title: '江屿线',   sub: '潮汐的门面',         emoji: '🎤' },
  huoqing: { title: '霍青线',   sub: '江边那家酒吧的老板', emoji: '🥃' }
};

/* 结局元信息（图鉴用） */
export const ENDING_META = {
  L1: { title: '《认领》',       type: 'long',  who: '塞拉斯' },
  L2: { title: '《显影液》',     type: 'long',  who: '顾淮' },
  L3: { title: '《听诊器》',     type: 'long',  who: '沈砚' },
  L4: { title: '《追光灯》',     type: 'long',  who: '江屿' },
  L5: { title: '《江心夜航》',   type: 'long',  who: '霍青' },
  S1: { title: '《双生》',       type: 'short', who: '隐藏真结局' },
  S2: { title: '《超模》',       type: 'short', who: '事业' },
  S3: { title: '《独居动物》',   type: 'short', who: '单身' },
  S4: { title: '《姐妹淘》',     type: 'short', who: '苏晚' },
  S5: { title: '《全职饲养员》', type: 'short', who: '亲情养成' },
  S6: { title: '《修罗场》',     type: 'short', who: '全员' },
  S7: { title: '《好好小姐》',   type: 'short', who: '万人迷崩坏' },
  S8: { title: '《错过》',       type: 'short', who: '遗憾' },
  S9: { title: '《S 市的第一场雪》', type: 'short', who: '平淡' }
};

export const STORAGE_KEY = 'xmm_save_v1';
