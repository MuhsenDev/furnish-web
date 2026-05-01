// Furnish — data layer.
// Mock affiliate database. In production this lives behind an API.

window.STYLES = [
  { id:'minimalist',    label:'Minimalist' },
  { id:'modern',        label:'Modern' },
  { id:'contemporary',  label:'Contemporary' },
  { id:'scandinavian',  label:'Scandinavian' },
  { id:'industrial',    label:'Industrial' },
  { id:'mid-century',   label:'Mid-Century Modern' },
  { id:'bohemian',      label:'Bohemian' },
  { id:'traditional',   label:'Traditional' },
  { id:'transitional',  label:'Transitional' },
  { id:'rustic',        label:'Rustic' },
  { id:'farmhouse',     label:'Farmhouse' },
  { id:'coastal',       label:'Coastal / Nautical' },
  { id:'art-deco',      label:'Art Deco' },
  { id:'eclectic',      label:'Eclectic' },
  { id:'japanese-zen',  label:'Japanese / Zen' }
];

window.COLOR_MOODS = [
  { id:'warm',       label:'Warm woods',         hex:'#8B6F47' },
  { id:'neutral',    label:'Soft neutrals',      hex:'#E5D4B8' },
  { id:'dark',       label:'Deep & moody',       hex:'#3E2723' },
  { id:'whites',     label:'Crisp whites',       hex:'#F7F2E8' },
  { id:'terracotta', label:'Earthy terracotta',  hex:'#B5603D' },
  { id:'sage',       label:'Sage & stone',       hex:'#9AA593' },
  { id:'jewel',      label:'Jewel tones',        hex:'#4A5D7E' },
  { id:'ocean',      label:'Ocean coastal',      hex:'#6F8FA8' }
];

// [BUDGET_RESET_PASS] Removed window.BUDGETS_LEGACY, BUDGET_MIN, BUDGET_MAX.
// Budget is now a transient per-generation slider value, set fresh every
// time on the capture screen. Range constants live inline at the slider's
// definition site in app.js. No persistent budget state remains.

// ==============================================================
// Scene SVG generator — self-drawn illustrations, guaranteed to
// match the caption because we render the scene ourselves.
// ==============================================================
(() => {
  const R = (x,y,w,h,fill,rx=0) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='${rx}' fill='${fill}'/>`;
  const C = (cx,cy,r,fill) => `<circle cx='${cx}' cy='${cy}' r='${r}' fill='${fill}'/>`;
  const E = (cx,cy,rx,ry,fill) => `<ellipse cx='${cx}' cy='${cy}' rx='${rx}' ry='${ry}' fill='${fill}'/>`;
  const L = (x1,y1,x2,y2,stroke,sw=4) => `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='${stroke}' stroke-width='${sw}' stroke-linecap='round'/>`;
  const PT = (d,fill,stroke,sw) => `<path d='${d}' fill='${fill||'none'}'${stroke?` stroke='${stroke}' stroke-width='${sw||3}' stroke-linecap='round' stroke-linejoin='round'`:''}/>`;
  const T = (x,y,text,fill,size=22,weight=600) => `<text x='${x}' y='${y}' fill='${fill}' font-size='${size}' font-family='Georgia, serif' text-anchor='middle' font-weight='${weight}'>${text}</text>`;

  const PALETTE = {
    // ROOM palettes (warm brown/beige family)
    living:    { bg1:'#F7E9CC', bg2:'#E1C998', wall:'#EDD9B6', floor:'#B58656', p1:'#8B6F47', p2:'#6B5235', p3:'#D4A574', leaf:'#4A6B3A' },
    bedroom:   { bg1:'#EFDDBE', bg2:'#D4B68A', wall:'#E7D1AC', floor:'#A88254', p1:'#8B6F47', p2:'#3E2723', p3:'#E3D0A9', leaf:'#4A6B3A' },
    kitchen:   { bg1:'#FAF2E0', bg2:'#D4B68A', wall:'#F1E4C4', floor:'#956B3E', p1:'#3E2723', p2:'#8B6F47', p3:'#D4A574', leaf:'#4A6B3A' },
    dining:    { bg1:'#EFDBB8', bg2:'#C7A26A', wall:'#E5CF9A', floor:'#A37A48', p1:'#6B5235', p2:'#3E2723', p3:'#D4A574', leaf:'#4A6B3A' },
    bathroom:  { bg1:'#E4EAEE', bg2:'#B7C9D3', wall:'#D6E1E8', floor:'#A6B3BC', p1:'#4A6572', p2:'#2C3A44', p3:'#FFFFFF', leaf:'#4A6B3A' },
    office:    { bg1:'#ECDBB2', bg2:'#B98F4F', wall:'#E2CE9A', floor:'#8A6238', p1:'#8B6F47', p2:'#3E2723', p3:'#D4A574', leaf:'#4A6B3A' },
    nursery:   { bg1:'#F6E7EE', bg2:'#E5C9D3', wall:'#EFD9E2', floor:'#C9A78F', p1:'#A37B88', p2:'#6B4B56', p3:'#E4C2CC', leaf:'#85A375' },
    closet:    { bg1:'#EDE2CB', bg2:'#C7AD80', wall:'#E2D1A9', floor:'#A68255', p1:'#6B5235', p2:'#3E2723', p3:'#D4A574', leaf:'#4A6B3A' },
    laundry:   { bg1:'#EAE5DC', bg2:'#B8B1A6', wall:'#DDD4C5', floor:'#95877B', p1:'#6B5235', p2:'#3E2723', p3:'#FFFFFF', leaf:'#4A6B3A' },

    // AESTHETIC palettes
    japandi:              { bg1:'#EFE4CF', bg2:'#D4BD98', p1:'#3A2B21', p2:'#8B6F47', p3:'#BA8A56', accent:'#4A6B3A' },
    cottagecore:          { bg1:'#F5E6DF', bg2:'#E0B7B0', p1:'#9B4E52', p2:'#D4A574', p3:'#85A34C', accent:'#E8BEA1' },
    'dark-academia':      { bg1:'#384139', bg2:'#1F2921', p1:'#D4AF7A', p2:'#B38149', p3:'#AE3C2D', accent:'#E8D5B0' },
    dopamine:             { bg1:'#FEEBC8', bg2:'#F6AD55', p1:'#E11D48', p2:'#0EA5E9', p3:'#10B981', accent:'#F6E05E' },
    'coastal-grandmother':{ bg1:'#F0EDE2', bg2:'#C5D5E0', p1:'#2E5275', p2:'#87A7BF', p3:'#B77D5A', accent:'#FFFFFF' },
    'bookshelf-wealth':   { bg1:'#F5E9CE', bg2:'#C0A169', p1:'#6B4423', p2:'#8B6F47', p3:'#AE3C2D', accent:'#D8BF85' },
    'quiet-luxury':       { bg1:'#EDE5D6', bg2:'#C9BEA6', p1:'#2A2420', p2:'#827465', p3:'#B08A55', accent:'#F0EAE0' },
    biophilic:            { bg1:'#E8EEDE', bg2:'#B3C994', p1:'#2F5233', p2:'#8FA380', p3:'#4A7C4F', accent:'#D4A574' },
    'wabi-sabi':          { bg1:'#EAE1D0', bg2:'#BCAA88', p1:'#4F3E2B', p2:'#8A7760', p3:'#A18055', accent:'#5E4A32' },
    maximalism:           { bg1:'#7E1D42', bg2:'#4A1127', p1:'#F6AD55', p2:'#38B2AC', p3:'#F6E05E', accent:'#E05C8E' },
    grandmillennial:      { bg1:'#F5E1DA', bg2:'#D9B4A4', p1:'#2A5259', p2:'#C27E67', p3:'#85A34C', accent:'#F2D8A9' },
    mediterranean:        { bg1:'#F7E7C8', bg2:'#E4C49A', p1:'#1F5B93', p2:'#D06B3A', p3:'#FFFFFF', accent:'#8FA380' },

    // SEASON palettes
    spring:  { bg1:'#EBF2DC', bg2:'#C2D98F', p1:'#4C8C4A', p2:'#85A34C', p3:'#F2B4BD', accent:'#FFFFFF' },
    summer:  { bg1:'#FFEBA0', bg2:'#FDB462', p1:'#E76F51', p2:'#F4A261', p3:'#FFD166', accent:'#2DA0C3' },
    autumn:  { bg1:'#F5D5A4', bg2:'#D6893E', p1:'#8C4A2B', p2:'#D17A46', p3:'#B42F21', accent:'#F2E0B0' },
    winter:  { bg1:'#E7EEF2', bg2:'#9AAFBE', p1:'#2C3E50', p2:'#6B7989', p3:'#FFFFFF', accent:'#B4D3E5' }
  };

  const SCENES = {
    // ========== ROOMS ==========
    living: p => `
      ${R(0,0,800,420,p.wall)}${R(0,420,800,180,p.floor)}
      ${R(470,90,240,260,'#E8EEF3')}${R(470,90,240,260,'none')}
      ${L(470,90,710,90,p.p2,8)}${L(470,350,710,350,p.p2,8)}
      ${L(470,90,470,350,p.p2,8)}${L(710,90,710,350,p.p2,8)}${L(590,90,590,350,p.p2,5)}
      ${R(70,360,420,130,p.p1,22)}${R(90,330,380,70,p.p2,16)}
      ${R(110,390,100,90,p.p3,12)}${R(230,390,100,90,p.p3,12)}${R(350,390,100,90,p.p3,12)}
      ${R(150,510,320,30,p.p2,6)}${R(190,540,40,50,p.p2)}${R(400,540,40,50,p.p2)}
      ${R(575,440,50,90,p.p1,4)}${C(600,410,55,p.leaf)}${C(575,380,35,p.leaf)}${C(630,390,38,p.leaf)}
    `,
    bedroom: p => `
      ${R(0,0,800,400,p.wall)}${R(0,400,800,200,p.floor)}
      ${R(540,80,200,220,'#EFE3CD')}${R(540,80,200,220,'none')}
      ${L(540,80,740,80,p.p2,6)}${L(540,300,740,300,p.p2,6)}
      ${L(540,80,540,300,p.p2,6)}${L(740,80,740,300,p.p2,6)}${L(640,80,640,300,p.p2,4)}
      ${R(140,260,500,70,p.p2,10)}${R(120,330,540,180,p.p1,14)}${R(150,340,480,40,p.p3,8)}
      ${R(180,350,130,22,'#FFFFFF',6)}${R(330,350,130,22,'#FFFFFF',6)}${R(480,350,130,22,'#FFFFFF',6)}
      ${R(660,420,100,90,p.p2,6)}${C(710,400,28,p.p3)}${R(697,360,26,50,p.p2,4)}
      ${R(20,430,90,70,p.p2,6)}${R(30,470,70,30,p.p3,4)}
    `,
    kitchen: p => `
      ${R(0,0,800,380,p.wall)}${R(0,380,800,220,p.floor)}
      ${R(60,80,680,100,p.p1,8)}${R(70,90,150,80,p.p3,4)}${R(230,90,150,80,p.p3,4)}${R(390,90,150,80,p.p3,4)}${R(550,90,180,80,p.p3,4)}
      ${R(60,380,400,60,p.p2,6)}${R(60,440,400,150,p.p1,8)}
      ${R(80,460,80,110,p.p3,6)}${R(170,460,80,110,p.p3,6)}${R(260,460,80,110,p.p3,6)}${R(350,460,100,110,p.p3,6)}
      ${R(470,380,300,60,p.p2,6)}${R(470,440,300,150,'#C9C0B4',8)}
      ${C(620,520,32,p.p2)}${C(620,520,22,'#1A1A1A')}
      ${R(240,220,30,110,p.p3,4)}${E(255,220,42,18,p.p3)}
    `,
    dining: p => `
      ${R(0,0,800,420,p.wall)}${R(0,420,800,180,p.floor)}
      ${R(200,160,400,40,p.p1,8)}${L(400,200,400,250,p.p1,4)}
      ${E(400,420,240,28,p.p2)}${R(280,400,240,20,p.p2,6)}${R(300,300,10,120,p.p1)}${R(490,300,10,120,p.p1)}
      ${R(200,440,70,110,p.p1,4)}${R(205,440,60,50,p.p3,4)}
      ${R(520,440,70,110,p.p1,4)}${R(525,440,60,50,p.p3,4)}
      ${R(320,445,70,110,p.p1,4)}${R(325,445,60,50,p.p3,4)}
      ${R(420,445,70,110,p.p1,4)}${R(425,445,60,50,p.p3,4)}
    `,
    bathroom: p => `
      ${R(0,0,800,400,p.wall)}${R(0,400,800,200,p.floor)}
      ${R(60,60,160,160,p.p3,12)}${R(90,90,100,100,'#FFFFFF',6)}
      ${R(520,60,200,160,p.p1,12)}${R(540,90,160,100,p.p3,6)}${R(600,220,40,30,p.p2)}
      ${E(320,440,190,60,'#FFFFFF')}${E(320,440,180,50,'#E9EEF3')}
      ${L(310,420,330,420,p.p2,8)}
      ${R(40,220,90,180,p.p3,6)}${R(50,240,70,80,p.p2,4)}
    `,
    office: p => `
      ${R(0,0,800,420,p.wall)}${R(0,420,800,180,p.floor)}
      ${R(540,60,210,320,p.p1,8)}${R(555,75,180,50,p.p3,4)}${R(555,135,180,50,p.p3,4)}${R(555,195,180,50,p.p3,4)}${R(555,255,180,50,p.p3,4)}
      ${R(555,80,16,40,p.p2)}${R(580,80,16,40,p.p2)}${R(555,140,16,40,p.p2)}${R(595,140,16,40,p.p2)}${R(620,200,16,40,p.p2)}
      ${R(80,340,380,30,p.p2,4)}${R(90,370,20,180,p.p2)}${R(440,370,20,180,p.p2)}
      ${R(110,240,220,140,p.p1,6)}${R(125,260,190,100,'#1A1A1A',4)}
      ${R(260,420,80,160,p.p2,10)}${C(300,410,30,p.p2)}${R(290,390,20,40,p.p2)}
    `,
    nursery: p => `
      ${R(0,0,800,420,p.wall)}${R(0,420,800,180,p.floor)}
      ${R(250,240,300,220,p.p1,14)}${R(265,260,270,30,p.p3,6)}
      ${L(265,260,265,460,p.p2,6)}${L(290,260,290,460,p.p2,6)}${L(315,260,315,460,p.p2,6)}${L(340,260,340,460,p.p2,6)}${L(365,260,365,460,p.p2,6)}${L(390,260,390,460,p.p2,6)}${L(415,260,415,460,p.p2,6)}${L(440,260,440,460,p.p2,6)}${L(465,260,465,460,p.p2,6)}${L(490,260,490,460,p.p2,6)}${L(515,260,515,460,p.p2,6)}
      ${R(250,430,300,30,p.p2,6)}
      ${C(400,120,10,p.p2)}${L(400,130,340,180,p.p2,3)}${L(400,130,400,180,p.p2,3)}${L(400,130,460,180,p.p2,3)}
      ${C(340,195,18,p.p3)}${C(400,195,18,p.accent)}${C(460,195,18,p.p3)}
      ${E(120,510,60,12,p.p3)}${E(680,510,60,12,p.p3)}
    `,
    closet: p => `
      ${R(0,0,800,600,p.wall)}
      ${R(60,60,680,40,p.p1,4)}${L(60,100,740,100,p.p2,6)}
      ${R(110,100,14,160,p.p2)}${R(170,100,14,160,p.p3)}${R(230,100,14,160,p.p2)}${R(290,100,14,160,p.p1)}${R(350,100,14,160,p.p2)}${R(420,100,14,160,p.p3)}${R(480,100,14,160,p.p2)}${R(540,100,14,160,p.p1)}${R(600,100,14,160,p.p3)}${R(670,100,14,160,p.p2)}
      ${R(105,110,24,110,p.p1,4)}${R(165,110,24,100,p.p2,4)}${R(225,110,24,130,p.p3,4)}${R(285,110,24,105,p.p2,4)}${R(345,110,24,125,p.p1,4)}${R(415,110,24,115,p.p3,4)}${R(475,110,24,120,p.p2,4)}${R(535,110,24,105,p.p1,4)}${R(595,110,24,130,p.p2,4)}${R(665,110,24,115,p.p3,4)}
      ${R(60,310,680,8,p.p1)}
      ${R(80,330,620,180,'none')}
      ${R(100,380,100,60,p.p1,6)}${R(220,380,100,60,p.p3,6)}${R(340,380,100,60,p.p2,6)}${R(460,380,100,60,p.p1,6)}${R(580,380,100,60,p.p3,6)}
      ${R(100,460,100,60,p.p2,6)}${R(220,460,100,60,p.p1,6)}${R(340,460,100,60,p.p3,6)}${R(460,460,100,60,p.p2,6)}${R(580,460,100,60,p.p1,6)}
    `,
    laundry: p => `
      ${R(0,0,800,420,p.wall)}${R(0,420,800,180,p.floor)}
      ${R(120,200,260,280,p.p3,12)}${R(135,215,230,20,p.p2,6)}${C(250,360,90,'#FFFFFF')}${C(250,360,75,'#D0E5EE')}${C(250,360,60,'#FFFFFF')}${C(180,240,10,p.p2)}${C(210,240,10,p.p2)}${C(320,240,10,p.p2)}
      ${R(420,200,260,280,p.p3,12)}${R(435,215,230,20,p.p2,6)}${C(550,360,90,'#FFFFFF')}${C(550,360,75,'#D0E5EE')}${C(550,360,60,'#FFFFFF')}${C(480,240,10,p.p2)}${C(510,240,10,p.p2)}${C(620,240,10,p.p2)}
      ${E(700,500,50,20,p.p1)}${R(665,430,70,70,p.p3,8)}${L(660,420,735,420,p.p1,6)}
    `,

    // ========== AESTHETICS ==========
    japandi: p => `
      ${R(0,400,800,200,p.p2)}${R(0,380,800,20,p.p1)}
      ${R(240,320,320,60,p.p1,6)}${R(258,260,40,60,p.p1)}${R(260,250,36,10,p.p1,4)}${R(506,260,40,60,p.p1)}${R(508,250,36,10,p.p1,4)}
      ${R(550,180,14,200,p.p3)}${C(557,180,30,p.accent)}${C(585,165,22,p.accent)}
      ${C(140,150,55,p.p3)}
    `,
    cottagecore: p => `
      ${C(130,100,14,p.p3)}${C(160,130,10,p.accent)}${C(200,90,12,p.p3)}${C(660,110,14,p.p3)}${C(700,140,10,p.accent)}${C(640,150,10,p.p3)}${C(80,240,10,p.accent)}${C(720,280,12,p.p3)}
      ${R(310,320,180,160,p.p2,16)}${E(400,320,90,26,p.p2)}${R(380,310,40,30,p.p2)}
      ${E(400,480,200,22,p.p1)}
      ${C(400,400,30,p.accent)}${C(400,395,10,p.p3)}
      ${C(200,400,30,p.p1)}${C(220,430,20,p.p3)}${C(580,400,30,p.p1)}${C(600,430,20,p.p3)}
    `,
    'dark-academia': p => `
      ${R(0,420,800,180,'#1A2118')}
      ${R(180,220,40,200,p.p1)}${R(220,200,40,220,p.p3)}${R(260,230,40,190,p.p2)}${R(300,210,40,210,p.p1)}${R(340,240,40,180,p.p3)}${R(380,200,40,220,p.p1)}${R(420,220,40,200,p.p3)}
      ${R(560,240,80,180,p.p1,6)}${E(600,240,40,10,p.p3)}${R(595,100,10,140,p.p3)}${E(600,100,28,10,p.p2)}
      ${R(480,400,180,12,p.p3,3)}
    `,
    dopamine: p => `
      ${PT(`M0,120 Q200,40 400,120 T800,120`,null,p.p1,14)}
      ${PT(`M0,300 Q200,220 400,300 T800,300`,null,p.p2,14)}
      ${PT(`M0,480 Q200,400 400,480 T800,480`,null,p.p3,14)}
      ${C(140,200,40,p.p1)}${C(660,180,50,p.p2)}${C(120,440,45,p.p3)}${C(680,440,40,p.accent)}
      ${C(400,160,30,p.accent)}${C(400,400,35,p.p1)}
    `,
    'coastal-grandmother': p => `
      ${R(0,0,800,100,p.p3)}${R(0,100,800,80,p.accent)}${R(0,180,800,80,p.p3)}${R(0,260,800,80,p.accent)}${R(0,340,800,80,p.p3)}${R(0,420,800,80,p.accent)}
      ${PT(`M380,480 Q400,300 420,480 Q400,420 380,480 Z`,p.p1)}
      ${PT(`M340,520 Q400,400 460,520 Q400,480 340,520 Z`,p.p2)}
      ${C(400,500,12,p.p1)}
    `,
    'bookshelf-wealth': p => `
      ${R(60,60,680,20,p.p2)}
      ${R(60,80,20,440,p.p2)}${R(720,80,20,440,p.p2)}
      ${R(60,200,680,16,p.p2)}${R(60,360,680,16,p.p2)}${R(60,520,680,4,p.p2)}
      ${R(90,90,22,108,p.p1)}${R(114,95,24,103,p.p3)}${R(140,100,26,98,p.p1)}${R(168,92,22,106,p.accent)}${R(192,85,20,113,p.p3)}${R(214,98,24,100,p.p1)}${R(240,90,22,108,p.p3)}${R(264,95,24,103,p.p1)}${R(290,100,22,98,p.accent)}${R(314,88,26,110,p.p1)}${R(342,92,20,106,p.p3)}${R(364,96,24,102,p.p1)}${R(390,89,22,109,p.p3)}${R(414,100,26,98,p.accent)}${R(442,85,20,113,p.p1)}${R(464,94,24,104,p.p3)}${R(490,92,22,106,p.p1)}${R(514,98,26,100,p.p3)}${R(542,90,20,108,p.accent)}${R(564,96,24,102,p.p1)}${R(590,92,22,106,p.p3)}${R(614,85,24,113,p.p1)}${R(640,98,22,100,p.accent)}${R(664,90,24,108,p.p3)}${R(690,94,22,104,p.p1)}
      ${R(90,250,22,108,p.p3)}${R(114,258,24,100,p.p1)}${R(140,245,26,113,p.accent)}${R(168,260,22,98,p.p3)}${R(192,250,20,108,p.p1)}${R(214,258,24,100,p.accent)}${R(240,245,22,113,p.p1)}${R(264,260,24,98,p.p3)}${R(290,255,22,103,p.p1)}${R(314,250,26,108,p.accent)}${R(342,260,20,98,p.p3)}${R(364,245,24,113,p.p1)}${R(390,258,22,100,p.accent)}${R(414,250,26,108,p.p3)}${R(442,260,20,98,p.p1)}${R(464,245,24,113,p.accent)}${R(490,258,22,100,p.p3)}${R(514,250,26,108,p.p1)}${R(542,260,20,98,p.accent)}${R(564,245,24,113,p.p3)}${R(590,258,22,100,p.p1)}${R(614,250,24,108,p.accent)}${R(640,260,22,98,p.p3)}${R(664,255,24,103,p.p1)}${R(690,250,22,108,p.p3)}
      ${R(90,410,22,108,p.accent)}${R(114,420,24,100,p.p3)}${R(140,410,26,110,p.p1)}${R(168,418,22,102,p.p3)}${R(192,410,20,110,p.accent)}${R(214,418,24,102,p.p1)}${R(240,408,22,112,p.p3)}${R(264,420,24,100,p.accent)}${R(290,410,22,110,p.p1)}${R(314,418,26,102,p.p3)}${R(342,408,20,112,p.p1)}${R(364,420,24,100,p.accent)}${R(390,408,22,112,p.p3)}${R(414,420,26,100,p.p1)}${R(442,410,20,110,p.accent)}${R(464,418,24,102,p.p1)}${R(490,410,22,110,p.p3)}${R(514,420,26,100,p.accent)}${R(542,408,20,112,p.p1)}${R(564,420,24,100,p.p3)}${R(590,410,22,110,p.accent)}${R(614,418,24,102,p.p1)}${R(640,408,22,112,p.p3)}${R(664,420,24,100,p.p1)}${R(690,412,22,108,p.accent)}
    `,
    'quiet-luxury': p => `
      ${PT(`M0,100 Q200,150 400,130 T800,120`,null,p.p2,2)}
      ${PT(`M0,220 Q250,280 500,250 T800,240`,null,p.p2,2)}
      ${PT(`M0,360 Q200,400 400,380 T800,360`,null,p.p2,2)}
      ${PT(`M0,480 Q300,540 600,500 T800,480`,null,p.p2,2)}
      ${C(400,300,110,'none')+`<circle cx='400' cy='300' r='110' fill='none' stroke='${p.p3}' stroke-width='14'/>`}
      ${C(400,300,70,'none')+`<circle cx='400' cy='300' r='70' fill='none' stroke='${p.p3}' stroke-width='4'/>`}
    `,
    biophilic: p => `
      ${PT(`M100,520 Q60,400 120,300 Q180,380 160,520 Z`,p.p1)}
      ${PT(`M200,520 Q150,360 220,240 Q290,340 260,520 Z`,p.p2)}
      ${PT(`M320,520 Q260,320 360,200 Q450,330 410,520 Z`,p.p1)}
      ${PT(`M500,520 Q420,300 540,160 Q640,310 590,520 Z`,p.p3)}
      ${PT(`M680,520 Q620,340 740,220 Q810,350 760,520 Z`,p.p2)}
      ${L(100,520,760,520,p.p1,6)}
    `,
    'wabi-sabi': p => `
      ${PT(`M120,420 Q100,520 200,540 Q400,560 600,540 Q700,520 680,420 Q660,380 400,400 Q140,380 120,420 Z`,p.p1)}
      ${PT(`M140,430 Q400,460 660,430`,null,p.accent,3)}
      ${C(220,200,60,p.p3)}${E(520,260,50,30,p.p2)}
      ${PT(`M300,150 Q340,100 380,150 Q340,110 300,150 Z`,p.accent)}
    `,
    maximalism: p => `
      ${C(140,160,90,p.p1)}${C(640,180,100,p.p2)}${C(160,460,110,p.p3)}${C(640,460,100,p.accent)}
      ${PT(`M0,300 Q200,340 400,300 T800,300`,null,p.p1,10)}
      ${PT(`M0,400 Q200,440 400,400 T800,400`,null,p.p3,10)}
      ${C(400,300,60,p.accent)}${C(400,300,30,p.p2)}
      ${R(300,60,40,40,p.p3)}${R(460,60,40,40,p.p1)}${R(380,540,40,40,p.p2)}
    `,
    grandmillennial: p => `
      ${C(120,120,30,p.p2)}${C(120,120,14,p.p3)}${C(400,120,30,p.p2)}${C(400,120,14,p.p3)}${C(680,120,30,p.p2)}${C(680,120,14,p.p3)}
      ${C(260,300,30,p.p3)}${C(260,300,14,p.p2)}${C(540,300,30,p.p3)}${C(540,300,14,p.p2)}
      ${C(120,480,30,p.p2)}${C(120,480,14,p.p3)}${C(400,480,30,p.p2)}${C(400,480,14,p.p3)}${C(680,480,30,p.p2)}${C(680,480,14,p.p3)}
      ${L(120,120,260,300,p.accent,3)}${L(260,300,400,120,p.accent,3)}${L(400,120,540,300,p.accent,3)}${L(540,300,680,120,p.accent,3)}
      ${L(120,480,260,300,p.accent,3)}${L(260,300,400,480,p.accent,3)}${L(400,480,540,300,p.accent,3)}${L(540,300,680,480,p.accent,3)}
    `,
    mediterranean: p => `
      ${R(0,450,800,150,p.p2)}
      ${PT(`M200,450 L200,260 Q200,120 400,120 Q600,120 600,260 L600,450 Z`,p.p3)}
      ${PT(`M220,450 L220,280 Q220,160 400,160 Q580,160 580,280 L580,450 Z`,'#6CA8DA')}
      ${L(400,160,400,440,p.p3,6)}${L(220,300,580,300,p.p3,6)}
      ${C(120,500,50,p.p1)}${C(130,460,30,p.p1)}
      ${C(680,500,55,p.accent)}${C(680,460,35,p.accent)}
    `,

    // ========== SEASONS ==========
    spring: p => `
      ${R(0,480,800,120,p.p2)}
      ${PT(`M600,600 Q600,420 500,320 Q420,240 300,180`,null,p.p1,10)}
      ${C(300,180,28,p.p3)}${C(320,140,22,p.p3)}${C(280,140,22,p.p3)}${C(360,180,22,p.p3)}${C(260,200,20,p.p3)}
      ${C(400,240,24,p.p3)}${C(420,210,18,p.p3)}${C(380,210,18,p.p3)}
      ${C(500,320,24,p.p3)}${C(520,300,18,p.p3)}${C(480,300,18,p.p3)}
      ${C(300,180,10,p.p1)}${C(400,240,10,p.p1)}${C(500,320,10,p.p1)}
    `,
    summer: p => `
      ${C(400,120,80,p.p3)}
      ${L(400,0,400,40,p.p3,8)}${L(400,200,400,240,p.p3,8)}${L(280,120,320,120,p.p3,8)}${L(480,120,520,120,p.p3,8)}
      ${L(320,40,350,70,p.p3,8)}${L(450,40,480,70,p.p3,8)}${L(320,200,350,170,p.p3,8)}${L(450,200,480,170,p.p3,8)}
      ${PT(`M200,520 Q400,320 600,520 Z`,p.p1)}
      ${L(400,320,400,560,p.p2,8)}
      ${R(380,480,40,80,p.accent)}
    `,
    autumn: p => `
      ${R(0,500,800,100,p.p2)}
      ${PT(`M150,200 Q130,160 110,200 Q90,240 150,240 Q140,220 150,200 Z`,p.p3)}${L(150,220,160,280,p.p2,3)}
      ${PT(`M300,120 Q280,80 260,120 Q240,160 300,160 Q290,140 300,120 Z`,p.p1)}${L(300,140,310,200,p.p2,3)}
      ${PT(`M500,260 Q480,220 460,260 Q440,300 500,300 Q490,280 500,260 Z`,p.accent)}${L(500,280,510,340,p.p2,3)}
      ${PT(`M660,180 Q640,140 620,180 Q600,220 660,220 Q650,200 660,180 Z`,p.p3)}${L(660,200,670,260,p.p2,3)}
      ${PT(`M220,340 Q200,300 180,340 Q160,380 220,380 Q210,360 220,340 Z`,p.p1)}${L(220,360,230,420,p.p2,3)}
      ${E(400,560,30,20,p.p1)}${L(400,540,400,500,p.p2,4)}
    `,
    winter: p => `
      ${R(0,520,800,80,p.accent)}
      ${L(300,0,300,600,p.p1,10)}${L(300,200,220,140,p.p1,6)}${L(300,200,380,140,p.p1,6)}${L(300,320,220,260,p.p1,6)}${L(300,320,380,260,p.p1,6)}${L(300,440,240,400,p.p1,6)}${L(300,440,360,400,p.p1,6)}
      ${C(550,100,14,p.p3)}${L(540,100,560,100,p.p3,3)}${L(550,90,550,110,p.p3,3)}${L(543,93,557,107,p.p3,3)}${L(557,93,543,107,p.p3,3)}
      ${C(650,240,12,p.p3)}${L(640,240,660,240,p.p3,3)}${L(650,230,650,250,p.p3,3)}
      ${C(550,380,13,p.p3)}${L(540,380,560,380,p.p3,3)}${L(550,370,550,390,p.p3,3)}
      ${C(700,420,10,p.p3)}${L(690,420,710,420,p.p3,3)}${L(700,410,700,430,p.p3,3)}
    `
  };

  window.sceneSVG = (kind, w = 800, h = 600) => {
    const pal = PALETTE[kind] || PALETTE.living;
    const builder = SCENES[kind] || SCENES.living;
    const inner = builder(pal);
    const svg =
`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' preserveAspectRatio='xMidYMid slice'>
<defs><linearGradient id='bgg' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='${pal.bg1}'/><stop offset='100%' stop-color='${pal.bg2}'/></linearGradient></defs>
<rect width='800' height='600' fill='url(#bgg)'/>${inner}</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };
})();

window.ROOM_TYPES = [
  { id:'living',   label:'Living room',  icon:'🛋️', image: sceneSVG('living') },
  { id:'bedroom',  label:'Bedroom',      icon:'🛏️', image: sceneSVG('bedroom') },
  { id:'kitchen',  label:'Kitchen',      icon:'🍳', image: sceneSVG('kitchen') },
  { id:'dining',   label:'Dining room',  icon:'🍽️', image: sceneSVG('dining') },
  { id:'bathroom', label:'Bathroom',     icon:'🛁', image: sceneSVG('bathroom') },
  { id:'office',   label:'Home office',  icon:'🖥️', image: sceneSVG('office') },
  { id:'nursery',  label:'Nursery',      icon:'👶', image: sceneSVG('nursery') },
  { id:'closet',   label:'Walk-In Closet', icon:'👚', image: sceneSVG('closet') },
  { id:'laundry',  label:'Laundry room', icon:'🧺', image: sceneSVG('laundry') }
];

// Slots to fill per room. Engine tries to cover each, scored by profile fit.
window.ROOM_SLOTS = {
  living:   ['sofa','table','rug','lighting','storage','decor','plant'],
  bedroom:  ['bed','nightstand','storage','rug','lighting','decor','bedding'],
  kitchen:  ['furniture','seating','lighting','storage','rug'],
  dining:   ['table','seating','lighting','storage'],
  bathroom: ['furniture','decor','storage','lighting'],
  office:   ['desk','seating','storage','lighting'],
  nursery:  ['bed','seating','storage','lighting','rug','decor'],
  closet:   ['storage','seating','lighting','decor'],
  laundry:  ['furniture','storage','lighting','decor']
};

// Approximate footprint sq ft per item type — used for fit warnings.
window.ITEM_FOOTPRINTS = {
  sofa: 22, bed: 36, table: 18, desk: 12, nightstand: 3,
  storage: 6, seating: 5, lighting: 1, rug: 0, decor: 1,
  plant: 2, bedding: 0, furniture: 16
};

// Seasonal / trending curated collections.
window.COLLECTIONS = [
  // Seasons — use real photos cycling through a slideshow
  { id:'spring', label:'Spring 2026', tagline:'Cherry blossoms & fresh linens', styles:['scandinavian','minimalist','coastal'],      colors:['whites','sage'],
    images: ['assets/seasons/spring/1.jpg','assets/seasons/spring/2.jpg','assets/seasons/spring/3.jpg','assets/seasons/spring/4.jpg'] },
  { id:'summer', label:'Summer 2026', tagline:'Sun-drenched, coral & citrus',   styles:['coastal','bohemian','modern'],              colors:['whites','ocean'],
    images: ['assets/seasons/summer/1.jpg','assets/seasons/summer/2.jpg','assets/seasons/summer/3.jpg','assets/seasons/summer/4.jpg'] },
  { id:'autumn', label:'Autumn 2026', tagline:'Wool, oak, and warm amber',      styles:['rustic','farmhouse','traditional'],         colors:['warm','terracotta'],
    images: ['assets/seasons/fall/1.jpg','assets/seasons/fall/2.jpg','assets/seasons/fall/3.jpg','assets/seasons/fall/4.jpg'] },
  { id:'winter', label:'Winter 2026', tagline:'Quiet blues & bare branches',    styles:['scandinavian','minimalist','japanese-zen'], colors:['whites','jewel'],
    images: ['assets/seasons/winter/1.jpg','assets/seasons/winter/2.jpg','assets/seasons/winter/3.jpg','assets/seasons/winter/4.jpg'] },

  // Trending aesthetics — using real curated photos
  { id:'japandi',             label:'Japandi',                 tagline:'Warm Minimalism Meets Quiet Craft',     styles:['japanese-zen','scandinavian','minimalist'], colors:['warm','neutral'],     image:'assets/trending/japandi.jpg' },
  { id:'cottagecore',         label:'Cottagecore',             tagline:'Wildflowers, Linen & Vintage Chintz',   styles:['farmhouse','bohemian','traditional'],       colors:['whites','sage'],      image:'assets/trending/cottagecore.jpg' },
  { id:'dark-academia',       label:'Dark Academia',           tagline:'Leather-Bound Books & Brass Lamps',     styles:['traditional','art-deco','eclectic'],        colors:['dark','jewel'],       image:'assets/trending/dark-academia.jpg' },
  { id:'dopamine',            label:'Dopamine Decor',          tagline:'Clashing Joy — Saturated + Squiggly',   styles:['eclectic','maximalism','bohemian'],         colors:['jewel','terracotta'], image:'assets/trending/dopamine.jpg' },
  { id:'coastal-grandmother', label:'Coastal Grandmother',     tagline:'Linen Stripes & Weathered Wicker',      styles:['coastal','traditional','farmhouse'],        colors:['whites','ocean'],     image:'assets/styles/coastal.jpg' },
  { id:'bookshelf-wealth',    label:'Bookshelf Wealth',        tagline:'Stacks of Collected Stories',           styles:['traditional','eclectic','art-deco'],        colors:['warm','dark'],        image:'assets/trending/bookshelf-wealth.jpg' },
  { id:'quiet-luxury',        label:'Quiet Luxury',            tagline:'Marble, Alabaster, Whispered Brass',    styles:['contemporary','modern','art-deco'],         colors:['neutral','whites'],   image:'assets/trending/quiet-luxury.jpg' },
  { id:'biophilic',           label:'Biophilic Design',        tagline:'Rooms That Breathe Like Gardens',       styles:['bohemian','coastal','minimalist'],          colors:['sage','neutral'],     image:'assets/trending/biophilic.jpg' },
  { id:'wabi-sabi',           label:'Wabi-Sabi',               tagline:'Perfectly Imperfect, Earthen Calm',     styles:['japanese-zen','rustic','minimalist'],       colors:['warm','terracotta'],  image:'assets/trending/wabi-sabi.jpg' },
  { id:'maximalism',          label:'Maximalism',              tagline:'More Is More — Colors, Patterns, Joy',  styles:['eclectic','bohemian','art-deco'],           colors:['jewel','dark'],       image:'assets/trending/maximalism.jpg' },
  { id:'grandmillennial',     label:'Grandmillennial',         tagline:'Chintz, Scallops & Granny-Chic',        styles:['traditional','eclectic','farmhouse'],       colors:['warm','neutral'],     image:'assets/trending/grandmillennial.jpg' },
  { id:'mediterranean',       label:'Mediterranean Revival',   tagline:'Arched Windows & Terracotta Roofs',     styles:['traditional','bohemian','coastal'],         colors:['warm','whites'],      image:'assets/trending/mediterranean.jpg' },
  { id:'gamer-den',           label:'Gamer Den',               tagline:'LED Glow, Dark Lacquer & Curated Shelves', styles:['industrial','modern','contemporary'],    colors:['dark','warm'],        image:'assets/trending/gamer.jpg' }
];

// Starter room templates — design from zero, no photo needed.
window.ROOM_TEMPLATES = [
  // Free tier: 5 templates covering the most common rooms. Gets users to aha
  // even if they skip the quiz (fallback path). Pro gates premium/specialty
  // templates (per Reforge PNIP Pyramid — Pro unlocks depth + polish).
  { id:'t-cozy-reading',    label:'Cozy Reading Nook',   type:'living',   dims:{w:8,l:9,h:9},   styles:['minimalist','scandinavian'],   colors:['warm','neutral'],    icon:'📖', image: sceneSVG('living') },
  { id:'t-farmhouse-kit',   label:'Farmhouse Kitchen',   type:'kitchen',  dims:{w:12,l:16,h:9}, styles:['farmhouse','rustic'],          colors:['warm','whites'],     icon:'🍳', image: sceneSVG('kitchen') },
  { id:'t-nursery-gentle',  label:'Gentle Nursery',      type:'nursery',  dims:{w:10,l:12,h:9}, styles:['scandinavian','minimalist'],   colors:['neutral','sage'],    icon:'👶', image: sceneSVG('nursery') },
  { id:'t-japandi-office',  label:'Japandi Home Office', type:'office',   dims:{w:9,l:11,h:9},  styles:['japanese-zen','minimalist'],   colors:['warm','neutral'],    icon:'🖥️', image: sceneSVG('office') },
  { id:'t-coastal-bath',    label:'Coastal Bathroom',    type:'bathroom', dims:{w:7,l:10,h:9},  styles:['coastal','modern'],            colors:['whites','ocean'],    icon:'🛁', image: sceneSVG('bathroom') },
  // Pro tier
  { id:'t-master-retreat',  label:'Master Bedroom',      type:'bedroom',  dims:{w:14,l:16,h:9}, styles:['modern','minimalist'],         colors:['neutral','warm'],    icon:'🛏️', image: sceneSVG('bedroom'), pro:true },
  { id:'t-midcentury-liv',  label:'Mid-Century Living',  type:'living',   dims:{w:14,l:18,h:9}, styles:['mid-century','modern'],        colors:['warm','jewel'],      icon:'🪑', image: sceneSVG('living'),  pro:true },
  { id:'t-walk-closet',     label:'Walk-In Closet',      type:'closet',   dims:{w:8,l:10,h:9},  styles:['modern','minimalist'],         colors:['neutral','whites'],  icon:'👚', image: sceneSVG('closet'),  pro:true }
];

// ============================================================
// Onboarding questions — 10-question flow (replaces the 4-Q style quiz)
// ============================================================
// Each answer maps to a concrete AI generation parameter. Style is never
// asked literally — it emerges from the combination of vibe + color +
// materials. Per ONBOARDING_AUDIT.md (approved 2026-04-26):
//   - Order is intentional: fun questions front-load momentum, practical
//     questions land while the user is committed.
//   - Q7 caps at 2 selections; Q9 caps at 3 with "nothing" as exclusive.
//   - Q10 has a follow-up screen with text input (spatial-marking deferred
//     per CONFLICT 4 → DEFERRED.md).
//   - Image-first questions use IMAGE_HINT entries; the renderer falls
//     back to a clean placeholder slot when image_path is null. Drop in
//     real images by editing this config — no component changes required.
//
// Reforge framework citations:
//   - User Psychology (Loewenstein information-gap): the front-loaded fun
//     questions create curiosity that carries through the practical ones.
//   - Progressive disclosure: each question reveals one decision; multi-
//     select questions show the cap inline.
//   - Loss aversion (Q9 negative prompts): users articulate what they
//     DON'T want as a way to clarify what they DO want.
// ============================================================
window.ONBOARDING_QUESTIONS = [
  {
    id: 'vibe',
    type: 'single_select',
    ai_param: 'emotional_anchor',
    // [feat-quiz-copy-rewrite] Friendlier, conversational. No em dashes.
    headline: 'Walking in, what do you want to feel?',
    image_kind: 'mood',  // square mood images, atmospheric not literal
    options: [
      { id:'calm_grounded',     label:'Calm and grounded',           image:null },
      { id:'energized_creative',label:'Energized and creative',      image:null },
      { id:'cozy_protected',    label:'Cozy and protected',          image:null },
      { id:'elevated_hotel',    label:'Like a fancy hotel',          image:null },
      { id:'inspired_artist',   label:"Like an artist's studio",     image:null }
    ],
    default: 'calm_grounded'
  },
  {
    id: 'color_appetite',
    type: 'single_select',
    ai_param: 'color_palette_intensity',
    // [feat-quiz-copy-rewrite] Plain language, "be honest" wink.
    headline: 'How do you feel about color? Be honest.',
    image_kind: 'palette', // color-swatch images showing the actual palette feel
    options: [
      { id:'neutrals_only',  label:'Neutrals only. Whites, beiges, woods.',           image:null },
      { id:'mostly_neutral', label:'Mostly neutral, with a pop or two',               image:null },
      { id:'confident_color',label:'Some real color. A few rich tones.',              image:null },
      { id:'bold',           label:'Go bold. Bring on the color.',                    image:null }
    ],
    default: 'mostly_neutral'
  },
  {
    id: 'decor_density',
    type: 'single_select',
    ai_param: 'decor_amount',
    // [feat-quiz-copy-rewrite] "How much stuff" read pathetic/unprofessional.
    // "How busy should it feel?" maps cleanly across the clean → maximalist
    // option spectrum (clean = not busy; maximalist = very busy) and lands
    // conversational without sliding into colloquial.
    headline: 'How busy should it feel?',
    image_kind: 'reference_room', // 4 reference rooms across the density spectrum
    options: [
      { id:'clean',                label:'Clean and minimal. Lots of breathing room.',         image:null },
      { id:'a_little_personality', label:'A little personality. Some accents, still clean.',  image:null },
      { id:'lived_in_rich',        label:'Lived in and warm. Layered, lots of decor.',        image:null },
      { id:'maximalist',           label:'Maximalist. Every surface tells a story.',          image:null }
    ],
    default: 'a_little_personality'
  },
  {
    id: 'scope',
    type: 'single_select',
    ai_param: 'ai_freedom_level',
    headline: 'What are we redesigning?',
    image_kind: 'icon',
    options: [
      { id:'just_furniture',  label:'Just the furniture',  svg:'scope-furniture' },
      { id:'furniture_decor', label:'Furniture and Decor', svg:'scope-furniture-decor' },
      { id:'whole_room',      label:'The whole room. Everything.',                   svg:'scope-whole-room' },
      { id:'surprise_me',     label:'Surprise me. Go full transformation.',          svg:'scope-surprise' }
    ],
    default: 'furniture_decor'
  },
  {
    id: 'natural_light',
    type: 'single_select',
    ai_param: 'lighting_strategy',
    // [feat-quiz-copy-rewrite] "the natural light situation" was stiff;
    // shorten and friendly-up.
    headline: "How's the natural light?",
    image_kind: 'icon',
    options: [
      { id:'tons',           label:'Tons of natural light all day',          svg:'light-tons' },
      { id:'bright_morning', label:'Bright in the morning, dim later',       svg:'light-morning' },
      { id:'dim',            label:'Dim. Needs help feeling bright.',        svg:'light-dim' },
      { id:'unsure',         label:'Honestly? It varies.',                   svg:'light-unsure' }
    ],
    default: 'unsure'
  },
  // [BUDGET_RESET_PASS] Q6 budget_tier removed. Budget is now a transient
  // per-generation slider on the capture screen, not an onboarding question.
  // Quiz is now 9 questions; renderer auto-derives "X of 9" from
  // ONBOARDING_QUESTIONS.length. Tutorial coachmark trio replacement:
  // vibe + materials + scope (was vibe + materials + budget) — see
  // CHANGES_APPLIED.md for the rationale.
  {
    id: 'materials',
    type: 'multi_select_max_2',
    ai_param: 'material_palette',
    // [feat-quiz-copy-rewrite] Tightened headline; option labels now
    // plain and concrete. metal_glass option dropped at source (was
    // dropped at runtime by an app.js override block because the
    // image asset wasn't shipped — same end state, simpler config).
    headline: 'Which speaks to you?',
    subhead: 'Pick up to 2',
    image_kind: 'texture', // close-up texture images
    max_selections: 2,
    options: [
      { id:'warm_woods',    label:'Warm woods and rattan',     image:null },
      { id:'soft_fabrics',  label:'Soft fabrics, like boucle', image:null },
      { id:'stone_ceramic', label:'Stone and ceramic',         image:null },
      { id:'vintage_patina',label:'Vintage and worn-in',       image:null },
      { id:'sleek_modern',  label:'Sleek and modern',          image:null }
    ],
    default: ['warm_woods', 'soft_fabrics']
  },
  {
    id: 'room_use',
    type: 'single_select',
    ai_param: 'function_priority',
    // [feat-quiz-copy-rewrite] Talk to me, not at me.
    headline: 'What do you actually do in here?',
    image_kind: 'icon',
    options: [
      { id:'slept_relaxed',     label:'Mostly sleeping or relaxing',                                  svg:'use-relax' },
      { id:'lived_in_all_day',  label:'Lived in all day. Work, hobbies, hanging out.',                svg:'use-all-day' },
      { id:'hosting',           label:'Hosting friends',                                              svg:'use-hosting' },
      { id:'aspirational',      label:'Looks first. I care more about looks than how it works.',     svg:'use-aspirational' }
    ],
    default: 'lived_in_all_day'
  },
  {
    id: 'avoid',
    type: 'multi_select_max_3',
    ai_param: 'negative_prompts',
    // [feat-quiz-copy-rewrite] Source headline already friendlier;
    // the app.js override below also rewrites it. Both layers carry
    // the same final copy so either path produces the same result.
    headline: 'What do you want to avoid?',
    subhead: 'Pick any that apply',
    image_kind: 'icon',
    max_selections: 3,
    // 'nothing' must be exclusive: when picked, deselects others;
    // others deselect 'nothing' when picked. Renderer enforces this.
    exclusive_option_id: 'nothing',
    options: [
      { id:'too_modern',    label:'Too modern or sterile',                svg:'avoid-modern' },
      { id:'too_rustic',    label:'Too rustic or "farmhouse"',            svg:'avoid-rustic' },
      { id:'busy_prints',   label:'Bold patterns or busy prints',         svg:'avoid-prints' },
      { id:'dark_heavy',    label:'Dark or heavy furniture',              svg:'avoid-dark' },
      { id:'trendy',        label:'Trendy stuff that gets dated fast',    svg:'avoid-trendy' },
      { id:'nothing',       label:'Nothing. Show me anything.',           svg:'avoid-nothing' }
    ],
    default: []
  },
  {
    id: 'dealbreaker',
    type: 'multi_select_with_followup',
    ai_param: 'preserve_element',
    // [feat-quiz-copy-rewrite] Source now carries the final copy AND
    // the structural changes (multi-select, subhead, exclusive
    // 'nothing', default empty array) that previously lived in an
    // app.js runtime override. Single source of truth.
    headline: 'Anything you want to keep?',
    subhead: 'Pick any that apply',
    image_kind: 'icon',
    // 'nothing' is exclusive: picking it deselects others; picking
    // anything else deselects 'nothing'. Renderer enforces.
    exclusive_option_id: 'nothing',
    options: [
      { id:'furniture', label:'A piece of furniture',            svg:'keep-furniture' },
      { id:'color',     label:'A color or paint job',            svg:'keep-color' },
      { id:'artwork',   label:'An artwork or something special', svg:'keep-artwork' },
      { id:'nothing',   label:"Nothing. Designer's choice.",     svg:'keep-nothing' }
    ],
    // Spatial-marking on the user's uploaded photo deferred per
    // ONBOARDING_AUDIT §J + DEFERRED.md. Followup ships text-only.
    followup: {
      mode: 'text', // future: 'tap_to_mark' once capture-before-quiz lands
      placeholder_by_kind: {
        furniture: 'e.g. the walnut sideboard against the south wall',
        color:     'e.g. the sage green paint, or the original hardwood',
        artwork:   'e.g. the framed Hockney print over the bed'
      },
      max_chars: 120
    },
    default: []
  }
];

// Backward-compat alias — any straggler reader of window.QUIZ still works
// during the transition. Layer 10 sweep verifies no readers remain.
window.QUIZ = window.ONBOARDING_QUESTIONS;

// SVG library for quiz options — hand-drawn, recognizable.
window.QUIZ_SVGS = {
  // -------- Q3 Weekend Icons (clear, literal) --------
  // Gallery & Coffee — three framed pictures on a wall + a coffee cup
  'gallery-coffee': `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="20" width="22" height="28" rx="2"/><line x1="14" y1="32" x2="28" y2="32"/><rect x="38" y="14" width="24" height="34" rx="2"/><circle cx="50" cy="28" r="4"/><line x1="42" y1="42" x2="58" y2="38"/><rect x="68" y="22" width="22" height="26" rx="2"/><line x1="73" y1="34" x2="85" y2="34"/><line x1="73" y1="40" x2="82" y2="40"/><path d="M28 60 H62 L58 84 H32 Z"/><path d="M62 64 Q72 64 72 72 Q72 80 62 80"/><line x1="38" y1="54" x2="38" y2="58"/><line x1="46" y1="52" x2="46" y2="58"/><line x1="54" y1="54" x2="54" y2="58"/></svg>`,
  // Shopping & Cooking — market basket on the left, pot with lid + steam on the right
  'shopping-cooking': `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 52 L42 52 L38 80 L12 80 Z"/><path d="M14 52 Q20 38 25 38 Q30 38 36 52"/><line x1="14" y1="62" x2="36" y2="62"/><line x1="16" y1="71" x2="34" y2="71"/><line x1="48" y1="56" x2="96" y2="56"/><circle cx="72" cy="52" r="2.5" fill="currentColor"/><line x1="66" y1="56" x2="78" y2="56" stroke-width="4"/><path d="M52 60 L92 60 L86 80 L58 80 Z"/><line x1="48" y1="66" x2="52" y2="66"/><line x1="92" y1="66" x2="96" y2="66"/><path d="M64 44 Q68 38 64 32"/><path d="M72 42 Q76 36 72 30"/><path d="M80 44 Q84 38 80 32"/></svg>`,
  // Beach Sunset — half sun setting on horizon + waves + rays
  'beach-sunset':   `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="60" x2="94" y2="60"/><path d="M30 60 A20 20 0 0 1 70 60 Z" fill="currentColor" fill-opacity="0.18"/><path d="M30 60 A20 20 0 0 1 70 60"/><line x1="50" y1="20" x2="50" y2="30"/><line x1="22" y1="36" x2="28" y2="42"/><line x1="78" y1="36" x2="72" y2="42"/><line x1="14" y1="50" x2="22" y2="52"/><line x1="86" y1="50" x2="78" y2="52"/><path d="M6 76 Q22 70 38 76 Q54 82 70 76 Q82 72 94 76"/><path d="M14 86 Q30 80 46 86 Q62 92 78 86 Q88 82 94 86"/></svg>`,
  // Tea & Garden — potted plant on the left + a teacup with a hanging tea bag (string + tag) on the right
  'tea-garden':     `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 64 L36 64 L32 80 L12 80 Z"/><line x1="6" y1="64" x2="38" y2="64"/><line x1="22" y1="64" x2="22" y2="34"/><path d="M22 50 Q11 46 8 36 Q16 34 20 44"/><path d="M22 44 Q33 40 36 30 Q28 28 24 40"/><path d="M22 36 Q16 32 16 22 Q24 22 22 32"/><path d="M52 56 L82 56 L78 76 L56 76 Z"/><path d="M82 60 Q90 60 90 66 Q90 73 82 72"/><line x1="48" y1="80" x2="86" y2="80"/><line x1="68" y1="56" x2="68" y2="46"/><rect x="64" y="40" width="8" height="6" rx="1"/><path d="M58 50 Q60 44 58 38"/></svg>`,

  // -------- Q5 Feeling Faces — colored per emotion --------
  // Calm — soft blue (peaceful), closed contented eyes + soft smile
  'calm':     `<svg viewBox="0 0 100 100" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke="#5A7A98"><circle cx="50" cy="50" r="42" fill="#D4E4F0"/><path d="M28 44 Q35 48 42 44" fill="none"/><path d="M58 44 Q65 48 72 44" fill="none"/><path d="M38 64 Q50 70 62 64" fill="none"/></svg>`,
  // Lived-In — warm amber (cozy), open soft eyes + warm full grin
  'lived-in': `<svg viewBox="0 0 100 100" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke="#9B6F2E"><circle cx="50" cy="50" r="42" fill="#F4D9A8"/><circle cx="36" cy="42" r="3" fill="#9B6F2E"/><circle cx="64" cy="42" r="3" fill="#9B6F2E"/><path d="M30 60 Q50 78 70 60" fill="none"/></svg>`,
  // Bold — deep red (confident), arched determined brows + alert wide eyes + steady smile
  'bold':     `<svg viewBox="0 0 100 100" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke="#A93B2C"><circle cx="50" cy="50" r="42" fill="#F2C4BB"/><path d="M28 34 Q34 28 42 32" fill="none" stroke-width="4"/><path d="M58 32 Q66 28 72 34" fill="none" stroke-width="4"/><circle cx="38" cy="46" r="3" fill="#A93B2C"/><circle cx="62" cy="46" r="3" fill="#A93B2C"/><path d="M38 64 Q50 70 62 64" fill="none"/></svg>`,
  // Crisp — cool steel-grey (clean), neutral eyes + asymmetric SMIRK (left flat, right curls up)
  'crisp':    `<svg viewBox="0 0 100 100" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke="#52647A"><circle cx="50" cy="50" r="42" fill="#DCE0E5"/><line x1="38" y1="40" x2="38" y2="48" fill="none"/><line x1="62" y1="40" x2="62" y2="48" fill="none"/><path d="M36 66 L52 66 Q60 66 64 58" fill="none"/></svg>`,

  // -------- Q6 Decoration density — wall with progressively more frames --------
  // Plain — bare wall + floor line
  'wall-plain':    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="14" width="80" height="64" rx="2"/><line x1="10" y1="78" x2="90" y2="78"/></svg>`,
  // A Few Decorations — wall + 2 well-spaced frames
  'wall-few':      `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="14" width="80" height="64" rx="2"/><line x1="10" y1="78" x2="90" y2="78"/><rect x="26" y="32" width="22" height="22" rx="1.5"/><rect x="56" y="36" width="22" height="18" rx="1.5"/></svg>`,
  // Majority — wall + 5 frames covering most of it
  'wall-majority': `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="14" width="80" height="64" rx="2"/><line x1="10" y1="78" x2="90" y2="78"/><rect x="16" y="20" width="18" height="22" rx="1"/><rect x="40" y="20" width="22" height="18" rx="1"/><rect x="68" y="22" width="16" height="22" rx="1"/><rect x="20" y="50" width="22" height="22" rx="1"/><rect x="50" y="50" width="34" height="22" rx="1"/></svg>`,
  // Fill The Wall Up! — gallery wall, packed tile-style
  'wall-full':     `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="10" width="88" height="70" rx="2"/><line x1="6" y1="80" x2="94" y2="80"/><rect x="12" y="14" width="18" height="14" rx="1"/><rect x="34" y="12" width="14" height="20" rx="1"/><rect x="52" y="14" width="20" height="12" rx="1"/><rect x="76" y="12" width="12" height="18" rx="1"/><rect x="12" y="32" width="14" height="22" rx="1"/><rect x="30" y="36" width="22" height="14" rx="1"/><rect x="56" y="32" width="16" height="22" rx="1"/><rect x="76" y="36" width="12" height="18" rx="1"/><rect x="12" y="60" width="20" height="14" rx="1"/><rect x="36" y="56" width="14" height="20" rx="1"/><rect x="54" y="60" width="18" height="16" rx="1"/><rect x="76" y="58" width="12" height="18" rx="1"/></svg>`
};

// SVG icons for room types — replaces the previous emoji set on the Room Type chooser.
window.ROOM_TYPE_SVGS = {
  living:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14V12a3 3 0 013-3h12a3 3 0 013 3v2"/><path d="M2 14h20v5H2z"/><path d="M5 19v2M19 19v2"/></svg>`,
  // Bedroom: proper bed with pillow, headboard, and clear frame
  bedroom:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-5a2 2 0 012-2h14a2 2 0 012 2v5"/><path d="M2 18h20"/><path d="M3 18v2M21 18v2"/><rect x="6" y="8" width="6" height="3" rx="1"/><path d="M3 13V8"/></svg>`,
  // Kitchen: stove + pot with steam — immediately reads as cooking
  kitchen:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13h14l-1 7H6z"/><path d="M4 13h16"/><path d="M7 13v-2a5 5 0 0110 0v2"/><path d="M9 5c0 1-1 1.5-1 2.5M13 4c0 1-1 1.5-1 2.5M17 5c0 1-1 1.5-1 2.5"/></svg>`,
  // Dining: round table (top-down view) with four chairs around it
  dining:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><rect x="10" y="3" width="4" height="3" rx="0.6"/><rect x="10" y="18" width="4" height="3" rx="0.6"/><rect x="3" y="10" width="3" height="4" rx="0.6"/><rect x="18" y="10" width="3" height="4" rx="0.6"/></svg>`,
  bathroom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18v3a3 3 0 01-3 3H6a3 3 0 01-3-3z"/><path d="M6 12V5a2 2 0 014 0"/><line x1="3" y1="20" x2="5" y2="22"/><line x1="21" y1="20" x2="19" y2="22"/></svg>`,
  office:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="11" rx="1"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/></svg>`,
  // Nursery: classic crib silhouette — vertical bars + rocker rails at the base
  nursery:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v10"/><path d="M20 9v10"/><path d="M4 9h16"/><line x1="8"  y1="11" x2="8"  y2="17"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="16" y1="11" x2="16" y2="17"/><path d="M3 19q9 4 18 0"/></svg>`,
  // Closet: coat hanger — universally read as wardrobe/closet
  closet:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V6a2 2 0 114 0"/><path d="M4 18l8-6 8 6H4z"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
  laundry:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><circle cx="8" cy="6.5" r="0.6" fill="currentColor"/><circle cx="11" cy="6.5" r="0.6" fill="currentColor"/></svg>`
};

// Title-case the ROOM_TYPES labels (was sentence case in places).
window.ROOM_TYPES.forEach(rt => {
  rt.label = rt.label.replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
});

// Items carry: id, name, type, roomTypes, styles, colors, source, price, icon, description, url, accent(hex).
window.FURNITURE_DB = [
  // ---- LIVING ----
  { id:'lr-sofa-01', name:'Loden 3-Seat Sofa',       type:'sofa',    roomTypes:['living'], styles:['modern','minimalist','scandinavian','contemporary'], colors:['warm','neutral'], source:'ikea',     price:899,  icon:'🛋️', description:'Clean lines, oatmeal linen blend.',         url:'https://www.ikea.com/',   accent:'#D8C6A6' },
  { id:'lr-sofa-02', name:'Heritage Chesterfield',   type:'sofa',    roomTypes:['living'], styles:['traditional','art-deco','eclectic'],                colors:['warm','dark'],    source:'amazon',   price:1299, icon:'🛋️', description:'Tufted leather chesterfield, tobacco brown.', url:'https://www.amazon.com/', accent:'#6B4A2B' },
  { id:'lr-sofa-03', name:'Loft Sectional',          type:'sofa',    roomTypes:['living'], styles:['industrial','modern','contemporary'],               colors:['dark','neutral'], source:'wayfair',  price:1399, icon:'🛋️', description:'Modular 4-piece with charcoal weave.',      url:'https://www.wayfair.com/',accent:'#3C3A38' },
  { id:'lr-sofa-04', name:'Palm Lounge Sofa',        type:'sofa',    roomTypes:['living'], styles:['coastal','bohemian','farmhouse'],                   colors:['whites','ocean'], source:'west-elm', price:1099, icon:'🛋️', description:'Slipcovered white linen, deep-seated.',     url:'https://www.westelm.com/',accent:'#EFE7DA' },
  { id:'lr-sofa-05', name:'Curve 72" Sofa',          type:'sofa',    roomTypes:['living'], styles:['mid-century','art-deco','contemporary'],            colors:['jewel','warm'],   source:'wayfair',  price:1599, icon:'🛋️', description:'Velvet, curved back, tapered walnut legs.', url:'https://www.wayfair.com/',accent:'#6C7A8A' },

  { id:'lr-coffee-01', name:'Oak Block Coffee Table',type:'table',   roomTypes:['living'], styles:['minimalist','scandinavian','modern','japanese-zen'],colors:['warm'],           source:'west-elm', price:449,  icon:'🟫', description:'Solid oak block on hairpin legs.',          url:'https://www.westelm.com/',accent:'#B58A5B' },
  { id:'lr-coffee-02', name:'Reclaimed Wood Table',  type:'table',   roomTypes:['living'], styles:['industrial','rustic','bohemian','farmhouse'],       colors:['warm','dark'],    source:'amazon',   price:329,  icon:'🟫', description:'Reclaimed pine, iron frame.',               url:'https://www.amazon.com/', accent:'#7A5A3A' },
  { id:'lr-coffee-03', name:'Marble Oval Coffee Table',type:'table', roomTypes:['living'], styles:['art-deco','contemporary','mid-century'],            colors:['neutral','jewel'],source:'wayfair',  price:699,  icon:'🟫', description:'Carrara top, brass base.',                  url:'https://www.wayfair.com/',accent:'#E8E0D2' },

  { id:'lr-rug-01',   name:'Beni Ourain Rug 6x9',    type:'rug',     roomTypes:['living','bedroom'], styles:['bohemian','scandinavian','eclectic'], colors:['neutral','warm'],   source:'rugs-usa', price:279,  icon:'🟤', description:'Cream wool with charcoal diamonds.',        url:'https://www.rugsusa.com/',accent:'#E8DCC2' },
  { id:'lr-rug-02',   name:'Persian Heritage Runner',type:'rug',     roomTypes:['living'], styles:['traditional','bohemian','eclectic','art-deco'],     colors:['warm'],           source:'amazon',   price:389,  icon:'🟤', description:'Hand-knotted, rust and ivory.',             url:'https://www.amazon.com/', accent:'#A3512C' },
  { id:'lr-rug-03',   name:'Jute Natural Rug',       type:'rug',     roomTypes:['living','dining'], styles:['coastal','farmhouse','japanese-zen','minimalist'], colors:['neutral','whites'], source:'west-elm', price:199, icon:'🟤', description:'Hand-woven jute, braided edge.',            url:'https://www.westelm.com/',accent:'#C9AE84' },

  { id:'lr-lamp-01',  name:'Arc Floor Lamp',         type:'lighting',roomTypes:['living'], styles:['modern','minimalist','contemporary','mid-century'], colors:['dark','neutral'], source:'ikea',     price:129,  icon:'💡', description:'Brushed brass arc with linen shade.',       url:'https://www.ikea.com/',   accent:'#B89C6D' },
  { id:'lr-lamp-02',  name:'Edison Tripod Lamp',     type:'lighting',roomTypes:['living'], styles:['industrial','rustic','traditional'],                colors:['warm','dark'],    source:'amazon',   price:89,   icon:'💡', description:'Walnut tripod, warm amber bulb.',           url:'https://www.amazon.com/', accent:'#5D4636' },
  { id:'lr-lamp-03',  name:'Paper Lantern Floor Lamp',type:'lighting',roomTypes:['living','bedroom'], styles:['japanese-zen','minimalist','scandinavian'], colors:['whites','neutral'], source:'west-elm', price:159, icon:'💡', description:'Rice paper shade on oak stand.',            url:'https://www.westelm.com/',accent:'#EFE4CC' },

  { id:'lr-shelf-01', name:'Kallax 4x2 Shelf',       type:'storage', roomTypes:['living','office'], styles:['minimalist','modern','scandinavian','contemporary'], colors:['neutral','warm'], source:'ikea', price:99, icon:'🗄️', description:'Cube bookshelf in oak effect.',              url:'https://www.ikea.com/',   accent:'#D4B286' },
  { id:'lr-shelf-02', name:'Ladder Bookshelf',       type:'storage', roomTypes:['living','office'], styles:['industrial','farmhouse','rustic'],           colors:['warm','dark'],    source:'amazon', price:179, icon:'🗄️', description:'Leaning 5-tier, walnut + iron.',             url:'https://www.amazon.com/', accent:'#6E4E2D' },

  { id:'lr-plant-01', name:'Fiddle Leaf Fig',        type:'plant',   roomTypes:['living','bedroom','office'], styles:['bohemian','modern','scandinavian','japanese-zen'], colors:['neutral'], source:'amazon', price:65, icon:'🪴', description:'6ft live plant in terracotta pot.',        url:'https://www.amazon.com/', accent:'#4A6B3A' },
  { id:'lr-plant-02', name:'Olive Tree 5ft',         type:'plant',   roomTypes:['living','dining'], styles:['coastal','farmhouse','minimalist','japanese-zen'], colors:['sage','neutral'], source:'west-elm', price:95, icon:'🌿', description:'Potted olive in clay planter.',            url:'https://www.westelm.com/',accent:'#8FA380' },

  { id:'lr-art-01',   name:'Abstract Triptych',      type:'decor',   roomTypes:['living'], styles:['modern','contemporary','minimalist','art-deco'],    colors:['neutral','warm'], source:'etsy',    price:149,  icon:'🖼️', description:'Set of 3 framed prints, beige tones.',       url:'https://www.etsy.com/',   accent:'#D2BD98' },
  { id:'lr-art-02',   name:'Vintage Botanical Set',  type:'decor',   roomTypes:['living','bedroom'], styles:['traditional','bohemian','farmhouse','eclectic'], colors:['warm'],  source:'amazon',  price:49, icon:'🖼️', description:'Set of 6 botanicals, oak frames.',           url:'https://www.amazon.com/', accent:'#87A37C' },
  { id:'lr-cushion-01',name:'Linen Throw Pillow Set',type:'decor',   roomTypes:['living','bedroom'], styles:['minimalist','scandinavian','modern','coastal'],colors:['neutral','warm'], source:'west-elm', price:79, icon:'🟨', description:'Pack of 4, stonewashed linen.',            url:'https://www.westelm.com/',accent:'#E3D2B1' },
  { id:'lr-vase-01',  name:'Sculptural Ceramic Vase',type:'decor',   roomTypes:['living','dining'], styles:['japanese-zen','minimalist','contemporary','eclectic'], colors:['neutral','sage'], source:'etsy', price:59, icon:'🏺', description:'Hand-thrown sage ceramic.',                url:'https://www.etsy.com/',   accent:'#A5AE93' },

  // ---- BEDROOM ----
  { id:'bd-bed-01', name:'Malm Queen Platform Bed',  type:'bed',     roomTypes:['bedroom'], styles:['minimalist','modern','scandinavian','contemporary'],colors:['warm','neutral'], source:'ikea',     price:299,  icon:'🛏️', description:'Low-profile oak veneer frame.',             url:'https://www.ikea.com/',   accent:'#CAA87A' },
  { id:'bd-bed-02', name:'Carved Heritage Bed',      type:'bed',     roomTypes:['bedroom'], styles:['traditional','art-deco','eclectic'],                colors:['warm','dark'],    source:'amazon',   price:899,  icon:'🛏️', description:'Hand-carved headboard, walnut finish.',     url:'https://www.amazon.com/', accent:'#5B3A1F' },
  { id:'bd-bed-03', name:'Upholstered Linen Bed',    type:'bed',     roomTypes:['bedroom'], styles:['modern','bohemian','transitional','coastal'],       colors:['neutral','whites'],source:'wayfair', price:549,  icon:'🛏️', description:'Channel-tufted, oatmeal linen.',            url:'https://www.wayfair.com/',accent:'#E2D6BD' },
  { id:'bd-bed-04', name:'Japandi Platform Bed',     type:'bed',     roomTypes:['bedroom'], styles:['japanese-zen','minimalist','scandinavian'],          colors:['warm','neutral'], source:'west-elm', price:699,  icon:'🛏️', description:'Low oak platform, sloped headboard.',       url:'https://www.westelm.com/',accent:'#B88B5C' },
  { id:'bd-bed-05', name:'Mid-Century Walnut Bed',   type:'bed',     roomTypes:['bedroom'], styles:['mid-century','modern','transitional'],               colors:['warm'],           source:'wayfair',  price:799,  icon:'🛏️', description:'Cane-back headboard, walnut frame.',        url:'https://www.wayfair.com/',accent:'#7A5431' },

  { id:'bd-night-01',name:'Hemnes Nightstand (pair)',type:'nightstand',roomTypes:['bedroom'], styles:['minimalist','scandinavian','modern','transitional'], colors:['warm'],         source:'ikea',     price:169,  icon:'🗃️', description:'Two-drawer nightstands in light brown.',    url:'https://www.ikea.com/',   accent:'#CFA878' },
  { id:'bd-night-02',name:'Rattan Nightstand Pair',  type:'nightstand',roomTypes:['bedroom'], styles:['bohemian','coastal','eclectic'],                     colors:['neutral','warm'],source:'amazon',   price:249,  icon:'🗃️', description:'Woven rattan front, oak legs.',              url:'https://www.amazon.com/', accent:'#C8A76E' },
  { id:'bd-dress-01',name:'6-Drawer Dresser',        type:'storage', roomTypes:['bedroom'], styles:['modern','mid-century','transitional'],               colors:['warm','neutral'], source:'west-elm', price:699,  icon:'🗄️', description:'Walnut with brass pulls.',                   url:'https://www.westelm.com/',accent:'#6F4A2B' },
  { id:'bd-rug-01', name:'Plush Shag Rug 5x7',       type:'rug',     roomTypes:['bedroom'], styles:['modern','scandinavian','bohemian','transitional'],    colors:['neutral','warm'], source:'amazon',   price:129,  icon:'🟤', description:'Sand shag, high-pile.',                       url:'https://www.amazon.com/', accent:'#D7C3A1' },
  { id:'bd-lamp-01',name:'Ceramic Table Lamp Pair',  type:'lighting',roomTypes:['bedroom'], styles:['modern','traditional','transitional','coastal'],      colors:['warm','neutral'], source:'amazon',   price:99,   icon:'💡', description:'Cream ceramic base, linen shade.',            url:'https://www.amazon.com/', accent:'#EDDFC5' },
  { id:'bd-mirror-01',name:'Arched Floor Mirror',    type:'decor',   roomTypes:['bedroom'], styles:['modern','bohemian','art-deco','contemporary'],        colors:['warm','dark'],    source:'wayfair',  price:249,  icon:'🪞', description:'Full-length arched, brass frame.',            url:'https://www.wayfair.com/',accent:'#A07A46' },
  { id:'bd-linen-01',name:'Washed Linen Bedding Set',type:'bedding', roomTypes:['bedroom'], styles:['minimalist','scandinavian','bohemian','coastal'],     colors:['neutral','warm'], source:'west-elm', price:189,  icon:'🛌', description:'Duvet + 2 shams in biscuit beige.',           url:'https://www.westelm.com/',accent:'#E2CEB0' },

  // ---- KITCHEN ----
  { id:'kt-island-01',name:'Butcher Block Island',   type:'furniture',roomTypes:['kitchen'], styles:['industrial','modern','farmhouse','rustic'],          colors:['warm'],           source:'amazon',   price:549,  icon:'🍳', description:'Rolling island with oak top.',                url:'https://www.amazon.com/', accent:'#B58656' },
  { id:'kt-stool-01', name:'Bar Stool Set (2)',      type:'seating', roomTypes:['kitchen'], styles:['modern','scandinavian','minimalist','contemporary'], colors:['warm','neutral'], source:'ikea',     price:149,  icon:'🪑', description:'Oak seat, black metal legs.',                 url:'https://www.ikea.com/',   accent:'#C7A172' },
  { id:'kt-stool-02', name:'Leather Saddle Stools (2)',type:'seating',roomTypes:['kitchen'], styles:['industrial','traditional','mid-century'],            colors:['warm','dark'],    source:'amazon',   price:299,  icon:'🪑', description:'Tobacco leather, iron base.',                 url:'https://www.amazon.com/', accent:'#7B4F2B' },
  { id:'kt-pendant-01',name:'Pendant Light Trio',    type:'lighting',roomTypes:['kitchen','dining'], styles:['industrial','modern','farmhouse','mid-century'], colors:['dark','warm'],source:'wayfair', price:229, icon:'💡', description:'Aged brass domes, set of 3.',                 url:'https://www.wayfair.com/',accent:'#A37A3A' },
  { id:'kt-shelf-01', name:'Floating Oak Shelves',   type:'storage', roomTypes:['kitchen'], styles:['minimalist','modern','scandinavian','japanese-zen'], colors:['warm'],           source:'amazon',   price:119,  icon:'🗄️', description:'Set of 3 solid oak shelves.',                 url:'https://www.amazon.com/', accent:'#C19768' },
  { id:'kt-rug-01',   name:'Runner Rug Natural',     type:'rug',     roomTypes:['kitchen'], styles:['bohemian','scandinavian','coastal','farmhouse'],     colors:['neutral','warm'], source:'rugs-usa', price:79,   icon:'🟤', description:'Jute runner, washable.',                      url:'https://www.rugsusa.com/',accent:'#D7BE8F' },

  // ---- DINING ----
  { id:'dn-table-01', name:'Oak Dining Table (6)',   type:'table',   roomTypes:['dining'], styles:['modern','scandinavian','minimalist','japanese-zen'], colors:['warm'],           source:'west-elm', price:1199, icon:'🍽️', description:'Solid oak, seats 6.',                         url:'https://www.westelm.com/',accent:'#B88A58' },
  { id:'dn-table-02', name:'Farmhouse Trestle Table',type:'table',   roomTypes:['dining'], styles:['farmhouse','rustic','traditional'],                  colors:['warm','dark'],    source:'amazon',   price:899,  icon:'🍽️', description:'Reclaimed pine farmhouse.',                   url:'https://www.amazon.com/', accent:'#7A5432' },
  { id:'dn-chair-01', name:'Wishbone Chair (set of 4)',type:'seating',roomTypes:['dining'], styles:['scandinavian','modern','mid-century','minimalist'],colors:['warm','neutral'], source:'wayfair',  price:429,  icon:'🪑', description:'Woven papercord seat, oak frame.',            url:'https://www.wayfair.com/',accent:'#CFA878' },
  { id:'dn-chair-02', name:'Windsor Chairs (set of 4)',type:'seating',roomTypes:['dining'], styles:['traditional','farmhouse','rustic','transitional'],  colors:['warm','dark'],    source:'amazon',   price:499,  icon:'🪑', description:'Classic spindle-back, walnut.',               url:'https://www.amazon.com/', accent:'#5F4024' },
  { id:'dn-chandelier-01',name:'Rattan Chandelier',  type:'lighting',roomTypes:['dining'], styles:['bohemian','coastal','modern','eclectic'],            colors:['warm','neutral'], source:'wayfair',  price:299,  icon:'💡', description:'Hand-woven rattan drum.',                     url:'https://www.wayfair.com/',accent:'#C39664' },
  { id:'dn-chandelier-02',name:'Crystal Deco Chandelier',type:'lighting',roomTypes:['dining'], styles:['art-deco','traditional','eclectic'],             colors:['jewel','whites'], source:'amazon',   price:479,  icon:'💡', description:'Brass and crystal, 6-light.',                 url:'https://www.amazon.com/', accent:'#C7A65A' },
  { id:'dn-sideboard-01',name:'Mid-Century Sideboard',type:'storage',roomTypes:['dining'], styles:['mid-century','modern','transitional'],               colors:['warm'],           source:'west-elm', price:899,  icon:'🗄️', description:'Walnut with tapered legs.',                   url:'https://www.westelm.com/',accent:'#74482A' },

  // ---- BATHROOM ----
  { id:'bt-vanity-01',name:'Oak Vanity 36"',         type:'furniture',roomTypes:['bathroom'], styles:['modern','minimalist','scandinavian','japanese-zen'],colors:['warm','neutral'], source:'wayfair', price:699, icon:'🛁', description:'White oak vanity with stone top.',           url:'https://www.wayfair.com/',accent:'#B88A58' },
  { id:'bt-vanity-02',name:'Beadboard Vanity',       type:'furniture',roomTypes:['bathroom'], styles:['farmhouse','coastal','traditional'],               colors:['whites','neutral'],source:'amazon',  price:499, icon:'🛁', description:'Cottage beadboard, marble top.',             url:'https://www.amazon.com/', accent:'#EDE3D1' },
  { id:'bt-mirror-01',name:'Round Rattan Mirror',    type:'decor',   roomTypes:['bathroom'], styles:['bohemian','coastal','farmhouse','eclectic'],        colors:['warm','neutral'], source:'amazon',   price:89,   icon:'🪞', description:'Hand-woven rattan frame, 30".',              url:'https://www.amazon.com/', accent:'#BC8E52' },
  { id:'bt-rack-01',  name:'Teak Towel Ladder',      type:'storage', roomTypes:['bathroom'], styles:['scandinavian','minimalist','japanese-zen','coastal'],colors:['warm'],         source:'amazon',   price:69,   icon:'🗄️', description:'Solid teak, 4 rungs.',                        url:'https://www.amazon.com/', accent:'#AA7A48' },
  { id:'bt-mat-01',   name:'Cotton Bath Mat Set',    type:'decor',   roomTypes:['bathroom'], styles:['minimalist','modern','scandinavian','coastal'],    colors:['neutral','whites'], source:'west-elm',price:49,  icon:'🟨', description:'Waffle-weave, sand beige.',                    url:'https://www.westelm.com/',accent:'#E5D9BD' },
  { id:'bt-sconce-01',name:'Brass Wall Sconces (pair)',type:'lighting',roomTypes:['bathroom'], styles:['art-deco','mid-century','traditional','transitional'], colors:['warm','jewel'], source:'wayfair', price:189, icon:'💡', description:'Pair of aged brass sconces.',                url:'https://www.wayfair.com/',accent:'#B38A48' },

  // ---- OFFICE ----
  { id:'of-desk-01',  name:'Oak Writing Desk',       type:'desk',    roomTypes:['office'], styles:['minimalist','modern','scandinavian','japanese-zen'], colors:['warm','neutral'], source:'ikea',     price:299,  icon:'🪑', description:'Clean oak desk with cable tray.',             url:'https://www.ikea.com/',   accent:'#C8A171' },
  { id:'of-desk-02',  name:'Industrial Pipe Desk',   type:'desk',    roomTypes:['office'], styles:['industrial','rustic','traditional'],                 colors:['warm','dark'],    source:'amazon',   price:229,  icon:'🪑', description:'Reclaimed top, iron pipe legs.',              url:'https://www.amazon.com/', accent:'#6A4626' },
  { id:'of-desk-03',  name:'Mid-Century Walnut Desk',type:'desk',    roomTypes:['office'], styles:['mid-century','modern','transitional'],               colors:['warm'],           source:'west-elm', price:799,  icon:'🪑', description:'Walnut with tapered legs, 60".',              url:'https://www.westelm.com/',accent:'#73482C' },
  { id:'of-chair-01', name:'Ergo Leather Chair',     type:'seating', roomTypes:['office'], styles:['modern','mid-century','industrial','contemporary'], colors:['dark','warm'],    source:'amazon',   price:349,  icon:'🪑', description:'Tan leather, lumbar support.',                url:'https://www.amazon.com/', accent:'#8A5C36' },
  { id:'of-shelf-01', name:'Tall Bookshelf',         type:'storage', roomTypes:['office','living'], styles:['modern','minimalist','traditional','transitional'], colors:['warm'], source:'west-elm', price:529, icon:'🗄️', description:'5-tier solid oak bookshelf.',                  url:'https://www.westelm.com/',accent:'#BD8E5C' },
  { id:'of-lamp-01',  name:'Brass Desk Lamp',        type:'lighting',roomTypes:['office','bedroom'], styles:['modern','mid-century','art-deco','traditional'], colors:['warm','dark'], source:'amazon', price:79, icon:'💡', description:'Articulating brass with linen shade.',        url:'https://www.amazon.com/', accent:'#B0873F' },

  // ---- NURSERY ----
  { id:'nr-crib-01',  name:'Oak Convertible Crib',   type:'bed',     roomTypes:['nursery'], styles:['scandinavian','minimalist','modern'],               colors:['warm','neutral'], source:'wayfair',  price:449,  icon:'🛏️', description:'Converts to toddler bed, solid oak.',         url:'https://www.wayfair.com/',accent:'#CFA878' },
  { id:'nr-crib-02',  name:'Cottage White Crib',     type:'bed',     roomTypes:['nursery'], styles:['coastal','farmhouse','traditional'],                colors:['whites','neutral'],source:'amazon',  price:329,  icon:'🛏️', description:'Classic white spindle, non-toxic finish.',     url:'https://www.amazon.com/', accent:'#F1E9DA' },
  { id:'nr-rocker-01',name:'Glider Rocking Chair',   type:'seating', roomTypes:['nursery'], styles:['traditional','modern','farmhouse','transitional'], colors:['neutral','warm'], source:'wayfair',  price:399,  icon:'🪑', description:'Swivel glider with ottoman, oat.',            url:'https://www.wayfair.com/',accent:'#D9C8A8' },
  { id:'nr-changer-01',name:'Oak Changing Dresser',  type:'storage', roomTypes:['nursery'], styles:['scandinavian','minimalist','modern'],               colors:['warm','neutral'], source:'ikea',     price:299,  icon:'🗄️', description:'6 drawers, removable changing topper.',       url:'https://www.ikea.com/',   accent:'#C8A171' },
  { id:'nr-rug-01',   name:'Cloud Nursery Rug',      type:'rug',     roomTypes:['nursery'], styles:['scandinavian','modern','minimalist','coastal'],    colors:['neutral','whites'],source:'amazon',  price:149,  icon:'🟤', description:'Soft pile, sage cloud motif.',                url:'https://www.amazon.com/', accent:'#BFC9B3' },
  { id:'nr-light-01', name:'Star Projector Nightlight',type:'lighting',roomTypes:['nursery'], styles:['modern','contemporary','scandinavian','eclectic'],colors:['whites','neutral'],source:'amazon',  price:45,   icon:'💡', description:'Warm glow, star ceiling projection.',         url:'https://www.amazon.com/', accent:'#EDE1C1' },
  { id:'nr-mobile-01',name:'Felt Ball Mobile',       type:'decor',   roomTypes:['nursery'], styles:['scandinavian','bohemian','minimalist'],              colors:['neutral','sage'], source:'etsy',    price:39,   icon:'🎐', description:'Handmade felt, oatmeal & sage.',              url:'https://www.etsy.com/',   accent:'#BFB38F' },
  { id:'nr-shelf-01', name:'Acacia Wall Shelves',    type:'storage', roomTypes:['nursery'], styles:['scandinavian','modern','minimalist'],                colors:['warm','neutral'], source:'amazon',  price:69,   icon:'🗄️', description:'Set of 3 floating acacia shelves.',            url:'https://www.amazon.com/', accent:'#B38D5E' },

  // ---- CLOSET ----
  { id:'cl-system-01',name:'Modular Closet System',  type:'storage', roomTypes:['closet'], styles:['modern','minimalist','contemporary'],                colors:['warm','neutral'], source:'ikea',     price:899,  icon:'🗄️', description:'Pax wardrobe with drawers & hanging.',        url:'https://www.ikea.com/',   accent:'#C8A171' },
  { id:'cl-shoe-01',  name:'Leather Shoe Rack 4-Tier',type:'storage',roomTypes:['closet'], styles:['industrial','traditional','transitional','modern'],colors:['warm','dark'],    source:'amazon',   price:129,  icon:'🗄️', description:'Walnut + leather strap, 4 tiers.',             url:'https://www.amazon.com/', accent:'#6F4A2B' },
  { id:'cl-drawer-01',name:'Bamboo Drawer Organizer',type:'storage', roomTypes:['closet','bedroom'], styles:['minimalist','japanese-zen','scandinavian'],colors:['warm','neutral'],source:'amazon',  price:45,   icon:'🗄️', description:'Adjustable bamboo dividers.',                 url:'https://www.amazon.com/', accent:'#C8A976' },
  { id:'cl-bench-01', name:'Upholstered Bench',      type:'seating', roomTypes:['closet','bedroom'], styles:['modern','transitional','traditional','art-deco'],colors:['neutral','jewel'], source:'west-elm', price:249, icon:'🪑', description:'Channel-tufted, bouclé.',                      url:'https://www.westelm.com/',accent:'#E1D5BF' },
  { id:'cl-mirror-01',name:'Tri-Fold Closet Mirror', type:'decor',   roomTypes:['closet'], styles:['modern','contemporary','art-deco'],                  colors:['neutral','warm'], source:'wayfair',  price:189,  icon:'🪞', description:'3-panel standing mirror, oak frame.',         url:'https://www.wayfair.com/',accent:'#C19768' },
  { id:'cl-light-01', name:'LED Closet Strip',       type:'lighting',roomTypes:['closet','laundry'], styles:['modern','contemporary','minimalist'],      colors:['whites','neutral'],source:'amazon',  price:29,   icon:'💡', description:'Motion-sensor warm LED, 10ft.',                url:'https://www.amazon.com/', accent:'#F3E9CE' },
  { id:'cl-valet-01', name:'Brass Valet Hooks',      type:'decor',   roomTypes:['closet'], styles:['art-deco','traditional','modern','industrial'],       colors:['warm','jewel'],  source:'amazon',   price:35,   icon:'🪝', description:'Set of 6 aged brass hooks.',                   url:'https://www.amazon.com/', accent:'#A97F3F' },

  // ---- LAUNDRY ----
  { id:'ld-fold-01',  name:'Folding Counter',        type:'furniture',roomTypes:['laundry'], styles:['modern','farmhouse','minimalist','scandinavian'], colors:['warm','whites'],  source:'wayfair',  price:299,  icon:'🧺', description:'Oak-top counter with laundry cubbies.',       url:'https://www.wayfair.com/',accent:'#CFA878' },
  { id:'ld-shelf-01', name:'Wall-Mount Drying Rack', type:'storage', roomTypes:['laundry'], styles:['farmhouse','rustic','industrial','minimalist'],    colors:['warm','dark'],   source:'amazon',    price:59,   icon:'🗄️', description:'Folds flat, oak + black steel.',               url:'https://www.amazon.com/', accent:'#74482A' },
  { id:'ld-hamper-01',name:'Woven Hamper Set',       type:'storage', roomTypes:['laundry','closet'], styles:['coastal','bohemian','scandinavian','farmhouse'], colors:['neutral','warm'], source:'amazon', price:79, icon:'🗄️', description:'Set of 2 seagrass hampers with lids.',          url:'https://www.amazon.com/', accent:'#CBA878' },
  { id:'ld-cabinet-01',name:'Laundry Utility Cabinet',type:'storage',roomTypes:['laundry'], styles:['farmhouse','traditional','transitional','modern'],colors:['whites','neutral'],source:'wayfair', price:449,  icon:'🗄️', description:'Tall white cabinet, adjustable shelves.',      url:'https://www.wayfair.com/',accent:'#EFE8D9' },
  { id:'ld-light-01', name:'Schoolhouse Flush Mount',type:'lighting',roomTypes:['laundry','bathroom'], styles:['farmhouse','traditional','transitional'], colors:['whites','warm'],source:'amazon',   price:89,   icon:'💡', description:'Milk glass + aged brass.',                    url:'https://www.amazon.com/', accent:'#C9A361' },
  { id:'ld-sign-01',  name:'Vintage "Laundry" Sign', type:'decor',   roomTypes:['laundry'], styles:['farmhouse','rustic','traditional'],                 colors:['warm','whites'], source:'etsy',     price:39,   icon:'🖼️', description:'Reclaimed wood hand-painted sign.',            url:'https://www.etsy.com/',   accent:'#876042' }
];
