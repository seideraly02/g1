import{d,f as b,E as v,o as l,c as p,a,b as y,F as g,r as m,u as c,n as f,g as C,A as M,t as u}from"./index-CK4BKNCt.js";import{_ as B}from"./BrandMark.vue_vue_type_script_setup_true_lang-I_goO-11.js";import{c as t}from"./createLucideIcon-DAuJNWTg.js";/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=t("BookOpenIcon",[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=t("ChartColumnIcon",[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=t("HouseIcon",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=t("PlayIcon",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=t("UserRoundIcon",[["circle",{cx:"12",cy:"8",r:"5",key:"1hypcn"}],["path",{d:"M20 21a8 8 0 0 0-16 0",key:"rfgkzh"}]]),R={class:"app-navigation","aria-label":"Негізгі мәзір"},j={class:"app-navigation__brand"},x={class:"app-navigation__items"},A=["aria-label","aria-current","onClick"],H={class:"app-navigation__label app-navigation__label--short"},N={class:"app-navigation__label app-navigation__label--full"},F=d({__name:"BottomNav",props:{active:{}},setup(_){const r=_,i=b(),h=v(),k=[{key:"home",label:"Басты бет",shortLabel:"Басты",route:"home",icon:I},{key:"subjects",label:"Пәндер",shortLabel:"Пәндер",route:"subjects",icon:L},{key:"training",label:"Жаттығу",shortLabel:"Жаттығу",route:"training",icon:V},{key:"progress",label:"Ілгерілеу",shortLabel:"Даму",route:"progress",icon:z},{key:"profile",label:"Профиль",shortLabel:"Мен",route:"profile",icon:w}];function n(s){return r.active?r.active===s.key:h.name===s.route}return(s,o)=>(l(),p("nav",R,[a("div",j,[y(B),o[1]||(o[1]=a("p",null,"ҰБТ дайындығы",-1))]),a("div",x,[(l(),p(g,null,m(k,e=>a("button",{key:e.key,class:f(["app-navigation__item",{"app-navigation__item--active":n(e)}]),type:"button","aria-label":e.label,"aria-current":n(e)?"page":void 0,onClick:P=>c(i).push({name:e.route})},[(l(),C(M(e.icon),{size:21,"stroke-width":n(e)?2.4:1.9},null,8,["stroke-width"])),a("span",H,u(e.shortLabel),1),a("span",N,u(e.label),1)],10,A)),64))]),a("button",{class:"app-navigation__profile",type:"button",onClick:o[0]||(o[0]=e=>c(i).push({name:"profile"}))},[...o[2]||(o[2]=[a("span",null,"С",-1),a("span",null,[a("strong",null,"Саят"),a("small",null,"Жоспар: 8 / 20")],-1)])])]))}});export{L as B,V as P,F as _};
