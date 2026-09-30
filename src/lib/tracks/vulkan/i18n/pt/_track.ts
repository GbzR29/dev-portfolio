// PT chapter titles and section names for the vulkan track (see vulkan/index.tsx).

const track = {
  titles: {
    "why-vulkan": "Por que Vulkan: a API explícita de GPU",
    instance: "Instance, extensões e validation layers",
    devices: "Dispositivos físicos, famílias de filas e o dispositivo lógico",
    swapchain: "Surface, swapchain e image views",
    pipeline: "O pipeline gráfico",
    commands: "Command buffers",
    synchronization: "Sincronização: fences, semáforos e barreiras",
  } as Record<string, string>,
  sections: {
    Foundations: "Fundamentos",
    Presentation: "Apresentação",
  } as Record<string, string>,
};

export default track;
