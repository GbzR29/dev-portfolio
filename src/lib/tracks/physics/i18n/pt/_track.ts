// PT chapter titles and section names for the physics track (see physics/index.tsx).

const track = {
  titles: {
    "units-measurement": "Unidades, dimensões e medidas",
    "kinematics-1d": "Movimento em linha reta",
    "kinematics-2d": "Projéteis: movimento no plano",
    "relative-motion": "Movimento relativo e referenciais",
    "newtons-laws": "As leis de Newton",
    "forces": "As forças do dia a dia",
    "circular-motion": "Movimento circular",
    "work-energy": "Trabalho, energia e potência",
    "momentum-collisions": "Quantidade de movimento e colisões",
    "rotation": "Rotação, torque e inércia",
    "angular-momentum": "Momento angular",
    "gravity-orbits": "Gravitação e órbitas",
  } as Record<string, string>,
  sections: {
    "Foundations & Motion": "Fundamentos e movimento",
    "Dynamics": "Dinâmica",
    "Conservation & Rotation": "Conservação e rotação",
  } as Record<string, string>,
};

export default track;
