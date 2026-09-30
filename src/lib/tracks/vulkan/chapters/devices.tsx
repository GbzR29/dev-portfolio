"use client";

// Foundations 3: devices — physical devices (enumerate, properties, device
// types, device apiVersion); features and the Features2 pNext chain (1.3:
// dynamicRendering, synchronization2); device extensions (VK_KHR_swapchain);
// queue families (flags, counts, implicit transfer, present support needs the
// surface, so the surface is created here); choosing families and scoring GPUs;
// the logical device (queue create infos, priorities, unique families, enabled
// features, extensions); fetching queues; shutdown order; a worked laptop
// example; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { QueueFamilyFigure } from "@/components/lesson/figures/vulkan/QueueFamilyFigure";
import { VulkanObjectsFigure } from "@/components/lesson/figures/vulkan/VulkanObjectsFigure";

export function DevicesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkDev_intro",
          "A computer can have several GPUs: a laptop often has a slow, efficient one built into the processor and a fast discrete card. Vulkan shows every GPU to the program and lets it choose, and then asks the program to state exactly what it will use of the chosen one: which features, which extensions and how many queues of which kind. The answer becomes the logical device, the VkDevice from which almost every later object is created. This chapter lists the GPUs, checks what each can do, picks the best one and opens it.")}
      </Lead>

      <H2>{tx(t, "vkDev_physTitle", "Physical devices")}</H2>
      <p>
        {tx(t, "vkDev_physBody",
          "A VkPhysicalDevice represents one GPU as it is installed. You do not create or destroy it; you get the list from the instance with the two-call idiom and then ask each one about itself. vkGetPhysicalDeviceProperties fills a VkPhysicalDeviceProperties struct:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkDev_tField", "Field"), tx(t, "vkDev_tMeaning", "Meaning")]}
        rows={[
          ["deviceName", tx(t, "vkDev_p1", "a readable name such as \"NVIDIA GeForce RTX 4070\", for logs and settings menus")],
          ["deviceType", tx(t, "vkDev_p2", "DISCRETE_GPU (a separate card with its own memory), INTEGRATED_GPU (part of the CPU, sharing system memory), VIRTUAL_GPU (inside a virtual machine), CPU (a software implementation such as lavapipe or SwiftShader) or OTHER")],
          ["apiVersion", tx(t, "vkDev_p3", "the highest Vulkan version this GPU's driver supports. We need at least 1.3.")],
          ["driverVersion, vendorID, deviceID", tx(t, "vkDev_p4", "identify the exact driver and chip; useful for bug reports and vendor-specific workarounds")],
          ["limits", tx(t, "vkDev_p5", "hundreds of numeric limits: the largest texture (maxImageDimension2D), the largest push-constant block, the alignment of uniform buffer offsets, and so on. Chapters point to the ones they depend on.")],
        ]}
      />

      <H3>{tx(t, "vkDev_featTitle", "Features: what the GPU can do")}</H3>
      <p>
        {tx(t, "vkDev_featBody",
          "Beyond the core API, many abilities are optional features: anisotropic filtering, 64-bit floats in shaders, wireframe drawing, and every addition of the later versions. The original Vulkan 1.0 features are fields of VkPhysicalDeviceFeatures. Features added later live in separate structs, one per version (VkPhysicalDeviceVulkan11Features, …12…, …13…), which are attached through pNext to VkPhysicalDeviceFeatures2. You build the chain, pass its head to vkGetPhysicalDeviceFeatures2, and the driver fills in every struct in the chain, writing VK_TRUE for each feature it supports.")}
      </p>
      <CodeBlock lang="cpp" filename="device.cpp" t={t}>{`static bool hasFeatures(VkPhysicalDevice gpu) {
    VkPhysicalDeviceVulkan13Features f13{};
    f13.sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_3_FEATURES;

    VkPhysicalDeviceFeatures2 f2{};
    f2.sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2;
    f2.pNext = &f13;                         // chain: f2 → f13
    vkGetPhysicalDeviceFeatures2(gpu, &f2);  // the driver fills in both

    return f13.dynamicRendering              // draw without VkRenderPass objects
        && f13.synchronization2              // the clearer barrier and submit API
        && f2.features.samplerAnisotropy;    // sharper textures at grazing angles
}`}</CodeBlock>
      <p>
        {tx(t, "vkDev_featAfter",
          "Supported is not the same as enabled. A feature the GPU supports is still off until you switch it on when creating the logical device, and using a feature that is off is a validation error. So feature handling always has two halves: query to choose a GPU, enable to use it.")}
      </p>

      <H3>{tx(t, "vkDev_extTitle", "Device extensions")}</H3>
      <p>
        {tx(t, "vkDev_extBody",
          "Device extensions add GPU-level functions, and just like instance extensions they must be requested by name. We need only one: VK_KHR_swapchain, which provides the images a window shows (next chapter). A GPU inside a server may not have it, since it has no screen. On macOS, MoltenVK also requires VK_KHR_portability_subset to be enabled, as the program's acknowledgement that a few rarely used Vulkan features are missing.")}
      </p>
      <CodeBlock lang="cpp" filename="device.cpp" t={t}>{`static const std::vector<const char*> kDeviceExtensions = {
    VK_KHR_SWAPCHAIN_EXTENSION_NAME,
#ifdef __APPLE__
    "VK_KHR_portability_subset",
#endif
};

static bool hasExtensions(VkPhysicalDevice gpu) {
    uint32_t count = 0;
    vkEnumerateDeviceExtensionProperties(gpu, nullptr, &count, nullptr);
    std::vector<VkExtensionProperties> available(count);
    vkEnumerateDeviceExtensionProperties(gpu, nullptr, &count, available.data());

    for (const char* wanted : kDeviceExtensions) {
        bool found = false;
        for (const VkExtensionProperties& e : available)
            found = found || std::strcmp(e.extensionName, wanted) == 0;
        if (!found) return false;
    }
    return true;
}`}</CodeBlock>

      <H2>{tx(t, "vkDev_queueTitle", "Queues and queue families")}</H2>
      <p>
        {tx(t, "vkDev_queueBody",
          "The GPU receives work through queues. A queue is an inbox: you submit command buffers to it and the GPU executes them, in order of submission within that queue. A GPU has several hardware engines that can work at the same time: the main graphics engine, often extra compute engines, and copy engines (DMA engines, which move data over the PCIe bus without using the shader cores). Vulkan groups queues that feed the same kind of engine into a queue family. All queues in a family are identical; families differ in what their queues can do, which vkGetPhysicalDeviceQueueFamilyProperties reports as flags:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkDev_tFlag", "Flag"), tx(t, "vkDev_tCan", "Queues of this family can run")]}
        rows={[
          ["VK_QUEUE_GRAPHICS_BIT", tx(t, "vkDev_q1", "drawing: rendering commands, the whole graphics pipeline")],
          ["VK_QUEUE_COMPUTE_BIT", tx(t, "vkDev_q2", "compute shader dispatches")],
          ["VK_QUEUE_TRANSFER_BIT", tx(t, "vkDev_q3", "copies between buffers and images. Every graphics or compute family can copy too, even if it does not report this bit; the specification guarantees it.")],
          ["VK_QUEUE_SPARSE_BINDING_BIT", tx(t, "vkDev_q4", "changing the memory behind sparse (partially resident) resources; an advanced feature this track does not use")],
          ["VK_QUEUE_VIDEO_DECODE_BIT_KHR …", tx(t, "vkDev_q5", "hardware video decoding and encoding, through video extensions")],
        ]}
      />
      <p>
        {tx(t, "vkDev_presentBody",
          "One ability is missing from the flags: presenting, that is, handing an image to the window system to show. Whether a family can present depends on the window as well as the GPU (a GPU may drive one monitor but not another), so it is asked per family and per surface with vkGetPhysicalDeviceSurfaceSupportKHR. That means we need the window's surface before choosing a GPU. The surface is a VkSurfaceKHR, created from the instance by SDL in one call; the next chapter explains it in full.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// App gains: VkSurfaceKHR surface; VkPhysicalDevice gpu; QueueFamilies families;
//            VkDevice device; VkQueue graphicsQueue, presentQueue;
if (!SDL_Vulkan_CreateSurface(app.window, app.instance, nullptr, &app.surface)) {
    std::fprintf(stderr, "SDL_Vulkan_CreateSurface: %s\\n", SDL_GetError());
    std::abort();
}`}</CodeBlock>

      <QueueFamilyFigure t={t} />

      <p>
        {tx(t, "vkDev_pickBody",
          "Our rule: we need one family that can draw and one that can present. On practically every real GPU the same family does both, and using one queue for both keeps the program simpler, so we prefer a family with both abilities and fall back to two different families only if none exists. UINT32_MAX marks \"not found\" because 0 is a valid family index.")}
      </p>
      <CodeBlock lang="cpp" filename="device.cpp" t={t}>{`struct QueueFamilies {
    uint32_t graphics = UINT32_MAX;
    uint32_t present  = UINT32_MAX;
    bool complete() const { return graphics != UINT32_MAX && present != UINT32_MAX; }
};

static QueueFamilies findQueueFamilies(VkPhysicalDevice gpu, VkSurfaceKHR surface) {
    uint32_t count = 0;
    vkGetPhysicalDeviceQueueFamilyProperties(gpu, &count, nullptr);
    std::vector<VkQueueFamilyProperties> families(count);
    vkGetPhysicalDeviceQueueFamilyProperties(gpu, &count, families.data());

    QueueFamilies found;
    for (uint32_t i = 0; i < count; ++i) {
        VkBool32 canPresent = VK_FALSE;
        vkGetPhysicalDeviceSurfaceSupportKHR(gpu, i, surface, &canPresent);
        const bool canDraw = families[i].queueFlags & VK_QUEUE_GRAPHICS_BIT;

        if (canDraw && canPresent) return {i, i};                    // the usual case
        if (canDraw && found.graphics == UINT32_MAX) found.graphics = i;
        if (canPresent && found.present == UINT32_MAX) found.present = i;
    }
    return found;                                                    // maybe incomplete
}`}</CodeBlock>

      <H2>{tx(t, "vkDev_chooseTitle", "Choosing the GPU")}</H2>
      <p>
        {tx(t, "vkDev_chooseBody",
          "Now each GPU can be tested and scored. A GPU that lacks something we need scores −1 and can never be chosen. Among the rest, a discrete GPU is preferred over an integrated one, because it is almost always much faster; the texture limit breaks ties between similar GPUs. A real engine would also let the user override the choice in a settings menu, since the \"best\" GPU is not always the one they want (on battery, for example).")}
      </p>
      <CodeBlock lang="cpp" filename="device.cpp" t={t}>{`static int score(VkPhysicalDevice gpu, VkSurfaceKHR surface) {
    VkPhysicalDeviceProperties props;
    vkGetPhysicalDeviceProperties(gpu, &props);

    if (props.apiVersion < VK_API_VERSION_1_3) return -1;   // 1.3 functions needed
    if (!hasExtensions(gpu))                   return -1;   // no swapchain
    if (!hasFeatures(gpu))                     return -1;   // missing a feature
    if (!findQueueFamilies(gpu, surface).complete()) return -1;

    int s = 0;
    if (props.deviceType == VK_PHYSICAL_DEVICE_TYPE_DISCRETE_GPU)   s += 1000;
    if (props.deviceType == VK_PHYSICAL_DEVICE_TYPE_INTEGRATED_GPU) s += 100;
    s += int(props.limits.maxImageDimension2D / 1024);      // tie-breaker
    return s;
}

void pickPhysicalDevice(App& app) {
    uint32_t count = 0;
    vkEnumeratePhysicalDevices(app.instance, &count, nullptr);
    std::vector<VkPhysicalDevice> gpus(count);
    vkEnumeratePhysicalDevices(app.instance, &count, gpus.data());

    int best = -1;
    for (VkPhysicalDevice gpu : gpus) {
        VkPhysicalDeviceProperties props;
        vkGetPhysicalDeviceProperties(gpu, &props);
        const int s = score(gpu, app.surface);
        std::printf("GPU %-40s score %d\\n", props.deviceName, s);
        if (s > best) { best = s; app.gpu = gpu; }
    }
    if (best < 0) {
        std::fprintf(stderr, "no GPU supports Vulkan 1.3 with what we need\\n");
        std::abort();
    }
    app.families = findQueueFamilies(app.gpu, app.surface);
}`}</CodeBlock>
      <p>
        {tx(t, "vkDev_orderNote",
          "The order of the tests matters: the 1.3 features struct may only be queried on a GPU whose driver knows version 1.3, so the version is checked before hasFeatures runs.")}
      </p>

      <H2>{tx(t, "vkDev_logicalTitle", "The logical device")}</H2>
      <p>
        {tx(t, "vkDev_logicalBody",
          "The logical device is your program's own connection to the chosen GPU. It is created with three lists: which queues to create, which features to enable, which extensions to enable. Nothing outside those lists may be used. Several programs can each have their own logical device on the same GPU, each with its own state; that is why it is \"logical\".")}
      </p>
      <LessonTable
        headers={[tx(t, "vkDev_tField", "Field"), tx(t, "vkDev_tMeaning", "Meaning")]}
        rows={[
          ["VkDeviceQueueCreateInfo", tx(t, "vkDev_l1", "one per queue family you want queues from: the family index, how many queues, and a priority for each. A family may appear only once in the list, so when graphics and present are the same family, there is one entry, not two.")],
          ["pQueuePriorities", tx(t, "vkDev_l2", "a number from 0.0 to 1.0 per queue: a hint for how the GPU should share time between this device's queues when they compete. With one queue, any value works; we use 1.0.")],
          [tx(t, "vkDev_l3a", "pNext → VkPhysicalDeviceFeatures2"), tx(t, "vkDev_l3", "the same chain of feature structs as the query, now with VK_TRUE only for the features we use. When the chain is used, the old pEnabledFeatures field must be null.")],
          ["ppEnabledExtensionNames", tx(t, "vkDev_l4", "the device extensions: VK_KHR_swapchain (and the portability subset on macOS)")],
        ]}
      />
      <CodeBlock lang="cpp" filename="device.cpp" t={t}>{`void createDevice(App& app) {
    // One VkDeviceQueueCreateInfo per distinct family (std::set removes the duplicate).
    const float priority = 1.0f;
    std::vector<VkDeviceQueueCreateInfo> queueInfos;
    for (uint32_t family : std::set<uint32_t>{app.families.graphics, app.families.present}) {
        VkDeviceQueueCreateInfo q{};
        q.sType            = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO;
        q.queueFamilyIndex = family;
        q.queueCount       = 1;
        q.pQueuePriorities = &priority;
        queueInfos.push_back(q);
    }

    // Enable exactly the features we use; everything else stays off.
    VkPhysicalDeviceVulkan13Features f13{};
    f13.sType            = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_3_FEATURES;
    f13.dynamicRendering = VK_TRUE;
    f13.synchronization2 = VK_TRUE;

    VkPhysicalDeviceFeatures2 features{};
    features.sType    = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2;
    features.pNext    = &f13;
    features.features.samplerAnisotropy = VK_TRUE;

    VkDeviceCreateInfo info{};
    info.sType                   = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO;
    info.pNext                   = &features;     // features travel in the chain...
    info.pEnabledFeatures        = nullptr;       // ...so this must stay null
    info.queueCreateInfoCount    = uint32_t(queueInfos.size());
    info.pQueueCreateInfos       = queueInfos.data();
    info.enabledExtensionCount   = uint32_t(kDeviceExtensions.size());
    info.ppEnabledExtensionNames = kDeviceExtensions.data();
    VK_CHECK(vkCreateDevice(app.gpu, &info, nullptr, &app.device));

    // The queues were created with the device; fetch their handles (index 0 in each family).
    vkGetDeviceQueue(app.device, app.families.graphics, 0, &app.graphicsQueue);
    vkGetDeviceQueue(app.device, app.families.present,  0, &app.presentQueue);
}`}</CodeBlock>
      <p>
        {tx(t, "vkDev_queueHandles",
          "When both families are the same, graphicsQueue and presentQueue are the same queue, which is exactly what we want. The code that submits and presents does not need to know. Queues are owned by the device: there is no vkDestroyQueue, they disappear with it.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "vkDev_layerNote", "Older tutorials also pass the validation layer to vkCreateDevice. Device layers were deprecated long ago; the layers enabled on the instance apply to every device, and the device's layer fields are ignored.")}
      </Callout>

      <H2>{tx(t, "vkDev_shutdownTitle", "Shutdown, updated")}</H2>
      <p>
        {tx(t, "vkDev_shutdownBody",
          "The device must be destroyed before the surface and the instance, and it must be idle: vkDeviceWaitIdle blocks the CPU until every queue has finished all submitted work. Destroying objects the GPU is still using is the destroy-while-in-use bug from the validation-layer figure. From now on, every chapter's shutdown starts with this call.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`void destroy(App& app) {
    vkDeviceWaitIdle(app.device);                 // let the GPU finish first
    vkDestroyDevice(app.device, nullptr);         // queues go with it
    vkDestroySurfaceKHR(app.instance, app.surface, nullptr);
    if (app.messenger) { /* ... as in the previous chapter ... */ }
    vkDestroyInstance(app.instance, nullptr);
    SDL_DestroyWindow(app.window);
    SDL_Quit();
}

int main() {
    // ... SDL_Init, SDL_CreateWindow, createInstance(app) as before ...
    SDL_Vulkan_CreateSurface(app.window, app.instance, nullptr, &app.surface);
    pickPhysicalDevice(app);
    createDevice(app);
    // ... main loop, destroy(app) ...
}`}</CodeBlock>
      <p>
        {tx(t, "vkDev_mapBody",
          "The object map now has its spine: instance, surface, physical device, device and queue. Every object of the following chapters hangs from the VkDevice band.")}
      </p>
      <VulkanObjectsFigure t={t} initial="queue" />

      <H2>{tx(t, "vkDev_workedTitle", "Worked example: a gaming laptop")}</H2>
      <p>
        {tx(t, "vkDev_worked1",
          "A laptop reports two GPUs. GPU 0: \"Intel UHD Graphics 770\", INTEGRATED_GPU, apiVersion 1.3.289, maxImageDimension2D 16384, one family with graphics, compute and transfer that can present. GPU 1: \"NVIDIA GeForce RTX 4060 Laptop GPU\", DISCRETE_GPU, apiVersion 1.3.280, maxImageDimension2D 32768, with the families of the NVIDIA-like layout in the figure. Both pass every test. Scores: GPU 0 = 100 + 16384 / 1024 = 100 + 16 = 116; GPU 1 = 1000 + 32768 / 1024 = 1000 + 32 = 1032. We choose GPU 1.")}
      </p>
      <p>
        {tx(t, "vkDev_worked2",
          "On GPU 1, family 0 has the graphics bit and can present, so findQueueFamilies returns {0, 0} at the first iteration. The std::set holds only {0}, so vkCreateDevice gets one VkDeviceQueueCreateInfo with one queue, and both vkGetDeviceQueue calls return the same handle. On a desktop that only has the integrated GPU, the same code picks it, with no change.")}
      </p>

      <H2>{tx(t, "vkDev_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkDev_tMistake", "Mistake"), tx(t, "vkDev_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkDev_e1", "Taking the first GPU in the list"), tx(t, "vkDev_e1b", "on laptops the first is often the integrated one, and on some machines it is a software renderer. Test and score every GPU.")],
          [tx(t, "vkDev_e2", "Listing the same family twice in the queue create infos"), tx(t, "vkDev_e2b", "a validation error (VUID-VkDeviceCreateInfo-queueFamilyIndex-02802). Deduplicate the family indices, as std::set does.")],
          [tx(t, "vkDev_e3", "Using a feature that was queried but not enabled"), tx(t, "vkDev_e3b", "querying only says the GPU could; vkCreateDevice must switch it on. The validation layer reports the first use of a disabled feature.")],
          [tx(t, "vkDev_e4", "Setting both pNext features and pEnabledFeatures"), tx(t, "vkDev_e4b", "not allowed: with VkPhysicalDeviceFeatures2 in the chain, pEnabledFeatures must be null. Put the 1.0 features in features2.features.")],
          [tx(t, "vkDev_e5", "Assuming the graphics family can present"), tx(t, "vkDev_e5b", "true in practice, not guaranteed. Always ask vkGetPhysicalDeviceSurfaceSupportKHR, and handle the split case.")],
          [tx(t, "vkDev_e6", "Initialising \"not found\" family indices to 0"), tx(t, "vkDev_e6b", "0 is a real family, so the check can never fail. Use UINT32_MAX or std::optional<uint32_t>.")],
          [tx(t, "vkDev_e7", "Destroying the device while the GPU is busy"), tx(t, "vkDev_e7b", "undefined behaviour, often a crash on exit. Call vkDeviceWaitIdle first.")],
        ]}
      />

      <KeyIdeas t={t} id="vkDev" items={[
        "A VkPhysicalDevice is an installed GPU: list them, read properties, features, extensions and queue families, then choose.",
        "Features are queried through a VkPhysicalDeviceFeatures2 pNext chain and must be enabled again at device creation to be used.",
        "VK_KHR_swapchain is the device extension needed to show images in a window.",
        "Queues are inboxes for command buffers; a queue family is a group of identical queues with the same GRAPHICS / COMPUTE / TRANSFER abilities.",
        "Present support is per family and per surface, so the surface is created before the GPU is chosen.",
        "Prefer one family that can both draw and present; score discrete GPUs above integrated ones and reject any GPU missing a requirement.",
        "vkCreateDevice takes the queues (one create info per distinct family), the enabled features and the extensions; queues are then fetched with vkGetDeviceQueue.",
        "Shutdown: vkDeviceWaitIdle, then device, surface, messenger, instance.",
      ]} />
    </Article>
  );
}
