from pathlib import Path
p=Path(__file__).resolve().parents[1]
def edit(file, replacements):
 s=(p/file).read_text()
 for old,new in replacements:
  assert s.count(old)==1, f'{file}: replacement match count {s.count(old)} for {old[:70]}'
  s=s.replace(old,new)
 (p/file).write_text(s)
edit('pieces.js',[
('classic:{light:0xe7d4b3,dark:0x75614a,w:0xfff0d3,b:0x526577,trim:0xffcb77,glow:0xffcb77,back:0x294156}',
 'classic:{light:0x9ca9a2,dark:0x617782,w:0xe4d2b5,b:0x314858,trim:0xb18b56,glow:0xcda569,back:0x182d3f}'),
('arcane:{light:0x7195aa,dark:0x354c6c,w:0xd8f4ff,b:0x624b9b,trim:0xffdca8,glow:0x64f1ff,back:0x233752}',
 'arcane:{light:0x859ba3,dark:0x4f617f,w:0xc8e3d8,b:0x3e365f,trim:0xae9a69,glow:0x69d8e5,back:0x1c2941}'),
('monsters:{light:0xb7bd85,dark:0x647753,w:0xc4f5ad,b:0x724763,trim:0xffc86e,glow:0xbaff70,back:0x2d493b}',
 'monsters:{light:0xa5ad88,dark:0x61745b,w:0xd1d5a7,b:0x493a4b,trim:0x9b7549,glow:0x9ce17d,back:0x1d332d}'),
('brick:{light:0xe8e1d1,dark:0x788da5,w:0xffe2a4,b:0xbe394e,trim:0xffffff,glow:0xffcb5e,back:0x2c4863}',
 'brick:{light:0xa4a6a1,dark:0x576e80,w:0xead49b,b:0x9f3444,trim:0xbfb6a4,glow:0xe5ae52,back:0x20394c}'),
('cosmic:{light:0x7994b9,dark:0x3a527c,w:0xcaf6ff,b:0x4c668d,trim:0xffa6d8,glow:0x73ffef,back:0x1f315a}',
 'cosmic:{light:0x7c96a6,dark:0x41556c,w:0xbcd9d7,b:0x314b63,trim:0xcc81a8,glow:0x65daca,back:0x16263e}'),
('color:dark?0xc9e3f1:p.trim','color:dark?0x94afc0:p.trim'),
('emissive:dark?0x34566c:p.glow,emissiveIntensity:dark?.22:.15','emissive:dark?0x253b4f:p.glow,emissiveIntensity:dark?.12:.08'),
('emissiveIntensity:1.25,roughness:.24','emissiveIntensity:.58,roughness:.32'),
('color:dark?0x9bb4c4:0xb18a61','color:dark?0x91a8b6:0x987549')
])
edit('characters.js',[
('color:dark?0xaac7db:palette.trim','color:dark?0x7e9caf:palette.trim'),
('emissiveIntensity:theme===\'cosmic\'?.78:.2','emissiveIntensity:theme===\'cosmic\'?.46:.13'),
])
edit('battle.js',[
('offsetHSL(0,0,.17)','offsetHSL(0,0,.055)'),
('55%, #101923 100%)','55%, #0a1521 100%)'),
('material(0x243748)','material(0x1a2837)'),
('renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;',
 'renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.84;'),
('new THREE.HemisphereLight(0xe9f6ff,0x9bafc6,3.1)','new THREE.HemisphereLight(0xdcecf8,0x718397,1.15)'),
('new THREE.DirectionalLight(0xffefd9,3.5)','new THREE.DirectionalLight(0xffedd3,2.0)'),
('light.shadow.mapSize.set(1024,1024);scene.add(light)',
 'light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.00012;light.shadow.normalBias=.018;light.shadow.radius=2.4;scene.add(light)'),
('new THREE.DirectionalLight(0xb2ecff,3.8)','new THREE.DirectionalLight(0xb2ecff,1.15)'),
('new THREE.DirectionalLight(0xffffff,1.15)','new THREE.DirectionalLight(0xffffff,.40)')
])
for f in ['pieces.js','characters.js','battle.js']:
 print(f, (p/f).stat().st_size)
