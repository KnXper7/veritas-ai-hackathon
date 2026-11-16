"use strict";
/* Fixed data: language codes, level names, and the built-in examples. */

const LANG = {
  "en":      {name:"English", cls:"en", html:"en"},
  "te":      {name:"Telugu", cls:"te", html:"te"},
  "te-Latn": {name:"Telugu in English letters", cls:"tl", html:"te-Latn"},
  "pl":      {name:"Polish", cls:"pl", html:"pl"},
  "other":   {name:"Other", cls:"ot", html:""}
};
const TARGET = {en:"English", te:"Telugu", pl:"Polish"};
const COMMON = ["", "Rare", "Uncommon", "Fairly common", "Common", "Very common"];
const LEVELS = [[0,"Newcomer"],[40,"Listener"],[100,"Regular"],[180,"Fluent"],[280,"Interpreter"]];

/* EXAMPLES ARE WRITTEN BY HAND. They are not model output and must never be counted as results.
   The Telugu and Polish in them still need a check by someone who speaks the language. */
const EXAMPLES = [
  {label:"Telugu + English", input:"I'm going to the market, నువ్వు వస్తావా?", a:{
    segments:[{text:"I'm going to the market, ",lang:"en"},{text:"నువ్వు వస్తావా?",lang:"te"}],
    literal:"I'm going to the market, you will come?",
    meaning:"I'm going to the market. Are you coming with me?",
    translation:"", tlang:"",
    phrases:[{text:"నువ్వు వస్తావా?",lang:"te",type:"everyday",meaning:"Are you coming?",
      tone:"Casual. నువ్వు is the informal \"you\", for friends, siblings and people younger than you.",
      where:"Inviting someone along, at home or with friends.",common:5,level:"beginner",similar:["మీరు వస్తారా? (polite)"]}],
    confidence:"high", note:""}},
  {label:"Tenglish", input:"Nenu late avutanu, traffic lo stuck ayyanu. Hold your horses!", a:{
    segments:[{text:"Nenu ",lang:"te-Latn"},{text:"late ",lang:"en"},{text:"avutanu, ",lang:"te-Latn"},{text:"traffic ",lang:"en"},{text:"lo ",lang:"te-Latn"},{text:"stuck ",lang:"en"},{text:"ayyanu. ",lang:"te-Latn"},{text:"Hold your horses!",lang:"en"}],
    literal:"I late will-become, traffic in stuck I-became. Keep hold of your horses!",
    meaning:"I'm going to be late, I got stuck in traffic. Be patient!",
    translation:"", tlang:"",
    phrases:[
      {text:"hold your horses",lang:"en",type:"idiom",meaning:"Wait. Be patient.",tone:"Playful and a little bossy. Fine with friends, not with a teacher.",where:"When someone is rushing you.",common:3,level:"intermediate",similar:["hang on","give me a minute"]},
      {text:"late avutanu",lang:"te-Latn",type:"everyday",meaning:"I will be late.",tone:"Neutral, everyday.",where:"Texting that you are running behind. The English word \"late\" is dropped straight into a Telugu sentence.",common:4,level:"beginner",similar:["aalasyam avutundi"]}],
    confidence:"medium", note:"Telugu in English letters has no standard spelling (avutanu, avthanu, avuthaanu), so the word-by-word language tags are less reliable here."}},
  {label:"Idioms", input:"Don't stress about the test, it's a piece of cake. Break a leg!", a:{
    segments:[{text:"Don't stress about the test, it's a piece of cake. Break a leg!",lang:"en"}],
    literal:"The test is a slice of cake. Break one of your legs!",
    meaning:"Don't worry about the test, it will be easy. Good luck!",
    translation:"పరీక్ష గురించి కంగారు పడకు, అది చాలా సులభం. ఆల్ ది బెస్ట్!", tlang:"te",
    phrases:[
      {text:"a piece of cake",lang:"en",type:"idiom",meaning:"Something very easy.",tone:"Friendly, informal.",where:"Talking about tests, chores or tasks.",common:4,level:"beginner",similar:["a breeze","no sweat"]},
      {text:"break a leg",lang:"en",type:"idiom",meaning:"Good luck.",tone:"Warm, informal. Sounds like an insult if you take it literally.",where:"Before a performance, a presentation or an exam.",common:3,level:"intermediate",similar:["good luck","you've got this"]}],
    confidence:"high", note:""}},
  {label:"Polish + English", input:"Nie mogę dziś, I'm swamped with homework, może jutro?", a:{
    segments:[{text:"Nie mogę dziś, ",lang:"pl"},{text:"I'm swamped with homework, ",lang:"en"},{text:"może jutro?",lang:"pl"}],
    literal:"I can't today, I'm sunk in a swamp with homework, maybe tomorrow?",
    meaning:"I can't today, I have far too much homework. Maybe tomorrow?",
    translation:"Nie mogę dziś, jestem zawalony pracą domową, może jutro?", tlang:"pl",
    phrases:[
      {text:"swamped",lang:"en",type:"idiom",meaning:"Extremely busy, with more work than you can handle.",tone:"Informal. Common at school and at work.",where:"Turning down plans or explaining a slow reply.",common:4,level:"intermediate",similar:["snowed under","buried in work"]},
      {text:"może jutro?",lang:"pl",type:"everyday",meaning:"Maybe tomorrow?",tone:"Neutral, friendly.",where:"Suggesting another time.",common:5,level:"beginner",similar:["innym razem"]}],
    confidence:"high", note:"The Polish uses zawalony, the masculine form. A girl or woman would say zawalona."}}
];
