"use client";

// Foundations 2: the instance — the loader and drivers (ICDs); the SDL3
// window; VkApplicationInfo and apiVersion; instance extensions (surface
// extensions from SDL, debug utils); the two-call enumerate idiom; layers and
// the validation layer; the debug messenger (severity, type, callback, loading
// extension functions with vkGetInstanceProcAddr, pNext for instance
// creation); macOS portability; debug vs release; reading a validation
// message; destroy order; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { LayerStackFigure } from "@/components/lesson/figures/vulkan/LayerStackFigure";

export function InstanceContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "vkInst_intro",
          "The first Vulkan object any program creates is the instance, a VkInstance. It is the connection between your program and the Vulkan system on this computer: creating it loads the drivers, switches on the extensions and layers you ask for, and gives you the handle every later object is traced back to. This chapter opens a window, creates the instance with the validation layer switched on, and sets up a callback that prints the layer's messages, so that from here on every mistake we make is reported the moment we make it.")}
      </Lead>

      <H2>{tx(t, "vkInst_loaderTitle", "The loader and the drivers")}</H2>
      <p>
        {tx(t, "vkInst_loaderBody",
          "Your program does not link against a GPU driver. It links against the Vulkan loader: vulkan-1.dll on Windows, libvulkan.so.1 on Linux. The loader is a small library from Khronos that finds the Vulkan drivers installed on the machine, each of which registers itself with a small JSON file. A driver is called an ICD (installable client driver); a laptop with an Intel integrated GPU and an NVIDIA discrete GPU has two, and one program can use both. When you call a Vulkan function, the loader sends it to the driver of the GPU the object belongs to.")}
      </p>
      <p>
        {tx(t, "vkInst_layersBody",
          "Between the loader and the driver the loader can insert layers. A layer is a library that sees every call on its way down and every result on its way back; it can inspect, log or measure them. The most important one is VK_LAYER_KHRONOS_validation, shipped with the SDK. Remember that the driver itself checks nothing. The validation layer does all the checking instead: it tests each call against the \"Valid Usage\" rules of the specification, several thousand of them, and reports every violation. Because it is a layer, it costs nothing when it is not loaded, which is the case in release builds.")}
      </p>

      <LayerStackFigure t={t} />

      <H2>{tx(t, "vkInst_windowTitle", "A window to draw into")}</H2>
      <p>
        {tx(t, "vkInst_windowBody",
          "Vulkan itself knows nothing about windows, so we open one with SDL3, exactly as in the SDL3 track, with one difference: the flag SDL_WINDOW_VULKAN tells SDL to prepare the window for Vulkan and to load the Vulkan loader for us. The program state lives in one struct, App, which gains members chapter by chapter.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`#include <SDL3/SDL.h>
#include <SDL3/SDL_vulkan.h>
#include <cstring>
#include <vector>
#include "vk_check.h"

#ifdef NDEBUG
constexpr bool kValidation = false;   // release build: no layers, no messages
#else
constexpr bool kValidation = true;    // debug build: validate everything
#endif

struct App {
    SDL_Window*              window    = nullptr;
    VkInstance               instance  = VK_NULL_HANDLE;
    VkDebugUtilsMessengerEXT messenger = VK_NULL_HANDLE;
};`}</CodeBlock>

      <H2>{tx(t, "vkInst_appInfoTitle", "VkApplicationInfo: who is asking, for which version")}</H2>
      <p>
        {tx(t, "vkInst_appInfoBody",
          "The instance create-info points to a VkApplicationInfo describing the program. The names and versions are only information; drivers sometimes use them to apply game-specific fixes. The field that matters is apiVersion: the highest Vulkan version the program intends to use. We ask for 1.3. Versions are packed into one 32-bit number by VK_MAKE_API_VERSION(variant, major, minor, patch); VK_API_VERSION_1_3 is that macro with 0, 1, 3, 0.")}
      </p>
      <p>
        {tx(t, "vkInst_versionBody",
          "Two versions are involved and they are easy to confuse. The instance version, returned by vkEnumerateInstanceVersion, is the version of the loader, which decides which instance-level functions exist. Each GPU also has its own device version, which the next chapter checks when it chooses a GPU. Asking for apiVersion 1.3 does not fail on an older GPU; it just means you may not use more than 1.3 anywhere. So we check the loader here and the GPU later.")}
      </p>

      <H2>{tx(t, "vkInst_extTitle", "Instance extensions")}</H2>
      <p>
        {tx(t, "vkInst_extBody",
          "Everything that is not in the core API comes as an extension, and extensions must be enabled by name when the object is created, or their functions may not be called. Instance extensions add instance-level features; device extensions (next chapter) add GPU features. We need two kinds of instance extension:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkInst_tExt", "Extension"), tx(t, "vkInst_tWhy", "Why")]}
        rows={[
          ["VK_KHR_surface + VK_KHR_win32_surface / VK_KHR_xlib_surface / VK_KHR_wayland_surface / VK_EXT_metal_surface…", tx(t, "vkInst_x1", "showing images in a window is not core Vulkan, because some uses (compute servers, offscreen rendering) have no screen at all. The generic surface extension plus the one for this platform's window system are needed. SDL_Vulkan_GetInstanceExtensions returns exactly the right list, so we never write platform names ourselves.")],
          ["VK_EXT_debug_utils", tx(t, "vkInst_x2", "lets the program receive the validation layer's messages through a callback, and give objects readable names that appear in those messages and in RenderDoc. Debug builds only.")],
          ["VK_KHR_portability_enumeration", tx(t, "vkInst_x3", "macOS only: allows the loader to list MoltenVK, which does not implement every Vulkan rule and is therefore hidden unless the program opts in.")],
        ]}
      />

      <H3>{tx(t, "vkInst_twoCallTitle", "The two-call idiom")}</H3>
      <p>
        {tx(t, "vkInst_twoCallBody",
          "To check that the validation layer is installed, we list the available layers. Vulkan functions that return a list all work the same way: call once with a null array to get the count, allocate an array of that size, call again to fill it. If the list could have grown in between, the second call returns VK_INCOMPLETE; for layers and extensions that does not happen while the program runs.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`static bool layerAvailable(const char* name) {
    uint32_t count = 0;
    vkEnumerateInstanceLayerProperties(&count, nullptr);          // 1st call: how many?
    std::vector<VkLayerProperties> layers(count);
    vkEnumerateInstanceLayerProperties(&count, layers.data());    // 2nd call: fill them in
    for (const VkLayerProperties& l : layers)
        if (std::strcmp(l.layerName, name) == 0) return true;
    return false;
}`}</CodeBlock>

      <H2>{tx(t, "vkInst_msgTitle", "The debug messenger")}</H2>
      <p>
        {tx(t, "vkInst_msgBody",
          "Without a messenger the validation layer prints to the console (on Windows, to the debugger output). A debug messenger routes every message to a function of ours instead, where we can format it, filter it, or set a breakpoint so the debugger stops exactly on the line that made the bad call. The messenger is described by a VkDebugUtilsMessengerCreateInfoEXT:")}
      </p>
      <LessonTable
        headers={[tx(t, "vkInst_tField", "Field"), tx(t, "vkInst_tMeaning", "Meaning")]}
        rows={[
          ["messageSeverity", tx(t, "vkInst_f1", "which importance levels to receive: VERBOSE (driver chatter), INFO (object creation and similar), WARNING (probably a bug or poor practice), ERROR (a Valid Usage rule is broken). We take WARNING and ERROR; the others are very noisy.")],
          ["messageType", tx(t, "vkInst_f2", "which kinds: GENERAL (not about the spec), VALIDATION (a rule broken), PERFORMANCE (legal but likely slow). We take all three.")],
          ["pfnUserCallback", tx(t, "vkInst_f3", "our function. It receives the severity, the type, a struct with the message text, the VUID and the objects involved, and the pUserData pointer.")],
          ["pUserData", tx(t, "vkInst_f4", "any pointer we want passed back to the callback, for example a logger. Unused here.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`static VKAPI_ATTR VkBool32 VKAPI_CALL debugCallback(
    VkDebugUtilsMessageSeverityFlagBitsEXT      severity,
    VkDebugUtilsMessageTypeFlagsEXT             /*type*/,
    const VkDebugUtilsMessengerCallbackDataEXT* data,
    void*                                       /*userData*/)
{
    const char* level = (severity & VK_DEBUG_UTILS_MESSAGE_SEVERITY_ERROR_BIT_EXT)   ? "ERROR"
                      : (severity & VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT) ? "WARNING"
                                                                                     : "INFO";
    std::fprintf(stderr, "[vulkan %s] %s\\n\\n", level, data->pMessage);
    return VK_FALSE;   // VK_TRUE would make the offending call fail; always return VK_FALSE
}

static VkDebugUtilsMessengerCreateInfoEXT messengerInfo() {
    VkDebugUtilsMessengerCreateInfoEXT info{};
    info.sType           = VK_STRUCTURE_TYPE_DEBUG_UTILS_MESSENGER_CREATE_INFO_EXT;
    info.messageSeverity = VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT
                         | VK_DEBUG_UTILS_MESSAGE_SEVERITY_ERROR_BIT_EXT;
    info.messageType     = VK_DEBUG_UTILS_MESSAGE_TYPE_GENERAL_BIT_EXT
                         | VK_DEBUG_UTILS_MESSAGE_TYPE_VALIDATION_BIT_EXT
                         | VK_DEBUG_UTILS_MESSAGE_TYPE_PERFORMANCE_BIT_EXT;
    info.pfnUserCallback = debugCallback;
    return info;
}`}</CodeBlock>
      <p>
        {tx(t, "vkInst_macroBody",
          "VKAPI_ATTR and VKAPI_CALL are macros from the Vulkan header that give the function the calling convention the loader expects (on 32-bit Windows it differs from the default). Every function you hand to Vulkan must be declared with them.")}
      </p>

      <H2>{tx(t, "vkInst_createTitle", "Creating the instance")}</H2>
      <p>
        {tx(t, "vkInst_createBody",
          "Now all the pieces go into a VkInstanceCreateInfo. Two details deserve attention. First, the messenger can only be created after the instance exists, so it would miss any problem inside vkCreateInstance and vkDestroyInstance themselves; putting its create-info in the instance's pNext chain gives those two calls a temporary messenger of their own. This is pNext in action: an extension struct attached to a core struct. Second, vkCreateDebugUtilsMessengerEXT belongs to an extension, and the loader library only exports the core functions and the window-system ones; any other extension function must be looked up at run time. We ask the instance for its address with vkGetInstanceProcAddr and cast it to the function-pointer type the header declares, PFN_ followed by the function's name.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`void createInstance(App& app) {
    uint32_t loaderVersion = 0;
    vkEnumerateInstanceVersion(&loaderVersion);
    if (loaderVersion < VK_API_VERSION_1_3) {
        std::fprintf(stderr, "a Vulkan 1.3 loader is required\\n");
        std::abort();
    }

    VkApplicationInfo appInfo{};
    appInfo.sType              = VK_STRUCTURE_TYPE_APPLICATION_INFO;
    appInfo.pApplicationName   = "vkfirst";
    appInfo.applicationVersion = VK_MAKE_API_VERSION(0, 1, 0, 0);
    appInfo.pEngineName        = "none";
    appInfo.engineVersion      = VK_MAKE_API_VERSION(0, 1, 0, 0);
    appInfo.apiVersion         = VK_API_VERSION_1_3;

    // The surface extensions this platform's windows need, as SDL knows them.
    Uint32 sdlCount = 0;
    const char* const* sdlExtensions = SDL_Vulkan_GetInstanceExtensions(&sdlCount);
    std::vector<const char*> extensions(sdlExtensions, sdlExtensions + sdlCount);

    std::vector<const char*> layers;
    const bool debug = kValidation && layerAvailable("VK_LAYER_KHRONOS_validation");
    if (debug) {
        layers.push_back("VK_LAYER_KHRONOS_validation");
        extensions.push_back(VK_EXT_DEBUG_UTILS_EXTENSION_NAME);
    }

    VkInstanceCreateInfo info{};
    info.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
#ifdef __APPLE__
    extensions.push_back(VK_KHR_PORTABILITY_ENUMERATION_EXTENSION_NAME);
    info.flags |= VK_INSTANCE_CREATE_ENUMERATE_PORTABILITY_BIT_KHR;   // list MoltenVK
#endif
    info.pApplicationInfo        = &appInfo;
    info.enabledLayerCount       = uint32_t(layers.size());
    info.ppEnabledLayerNames     = layers.data();
    info.enabledExtensionCount   = uint32_t(extensions.size());
    info.ppEnabledExtensionNames = extensions.data();

    VkDebugUtilsMessengerCreateInfoEXT dbg = messengerInfo();
    if (debug) info.pNext = &dbg;   // also report problems inside vkCreate/DestroyInstance

    VK_CHECK(vkCreateInstance(&info, nullptr, &app.instance));

    if (debug) {
        auto create = reinterpret_cast<PFN_vkCreateDebugUtilsMessengerEXT>(
            vkGetInstanceProcAddr(app.instance, "vkCreateDebugUtilsMessengerEXT"));
        VK_CHECK(create(app.instance, &dbg, nullptr, &app.messenger));
    }
}`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "vkInst_pointerNote", "The create-info holds pointers into the extensions and layers vectors, so every push_back must happen before those pointers are taken: a push_back may move the vector's storage and leave the pointer dangling. That is why the macOS extension is added before ppEnabledExtensionNames is set.")}
      </Callout>
      <p>
        {tx(t, "vkInst_failBody",
          "vkCreateInstance fails with VK_ERROR_LAYER_NOT_PRESENT or VK_ERROR_EXTENSION_NOT_PRESENT if anything requested is missing, which is why the layer is checked first and only requested when present; a user without the SDK still gets a working (unvalidated) program. VK_ERROR_INCOMPATIBLE_DRIVER means no driver at all could be found, typically a machine with no Vulkan-capable GPU or a macOS program without the portability flag.")}
      </p>

      <H2>{tx(t, "vkInst_loopTitle", "The main loop and shutdown")}</H2>
      <p>
        {tx(t, "vkInst_loopBody",
          "Shutdown runs in the reverse order of creation. The messenger was created from the instance, so it goes first, again through a function pointer; then the instance; then the window. Destroying the instance while the messenger still exists is itself a validation error, which the instance's own pNext messenger would report.")}
      </p>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`void destroy(App& app) {
    if (app.messenger) {
        auto destroyMessenger = reinterpret_cast<PFN_vkDestroyDebugUtilsMessengerEXT>(
            vkGetInstanceProcAddr(app.instance, "vkDestroyDebugUtilsMessengerEXT"));
        destroyMessenger(app.instance, app.messenger, nullptr);
    }
    vkDestroyInstance(app.instance, nullptr);
    SDL_DestroyWindow(app.window);
    SDL_Quit();
}

int main() {
    App app;
    if (!SDL_Init(SDL_INIT_VIDEO)) {
        std::fprintf(stderr, "SDL_Init: %s\\n", SDL_GetError());
        return 1;
    }
    app.window = SDL_CreateWindow("vkfirst", 1280, 720, SDL_WINDOW_VULKAN | SDL_WINDOW_RESIZABLE);
    createInstance(app);

    for (bool running = true; running;) {
        SDL_Event e;
        while (SDL_PollEvent(&e))
            if (e.type == SDL_EVENT_QUIT) running = false;
        // drawing arrives in the Presentation section
    }
    destroy(app);
}`}</CodeBlock>

      <H2>{tx(t, "vkInst_readTitle", "Reading a validation message")}</H2>
      <p>
        {tx(t, "vkInst_readBody",
          "Validation messages look intimidating, but they always have the same parts. Here is a typical one, for a buffer created with size 0:")}
      </p>
      <CodeBlock lang="text" filename="stderr" t={t}>{`[vulkan ERROR] Validation Error: [ VUID-VkBufferCreateInfo-size-00912 ]
Object 0: handle = 0x1f2a4c0e8d0, type = VK_OBJECT_TYPE_DEVICE; | MessageID = 0x7c54445e |
vkCreateBuffer(): pCreateInfo->size is zero.
The Vulkan spec states: size must be greater than 0
(https://vulkan.lunarg.com/doc/view/1.3.290.0/windows/1.3-extensions/vkspec.html#VUID-VkBufferCreateInfo-size-00912)`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "vkInst_tPart", "Part"), tx(t, "vkInst_tTells", "What it tells you")]}
        rows={[
          ["VUID-VkBufferCreateInfo-size-00912", tx(t, "vkInst_p1", "the Valid Usage ID: which rule, on which struct or function, about which field. Search the specification for it to read the rule and its context.")],
          [tx(t, "vkInst_p2a", "Object 0: handle, type"), tx(t, "vkInst_p2", "the objects involved. Raw handles are hard to recognise; naming objects with vkSetDebugUtilsObjectNameEXT (a later chapter) makes them appear here as \"vertex buffer\" or \"shadow map\".")],
          [tx(t, "vkInst_p3a", "The function and the problem"), tx(t, "vkInst_p3", "which call, and what was wrong in its arguments.")],
          [tx(t, "vkInst_p4a", "\"The Vulkan spec states\""), tx(t, "vkInst_p4", "the rule, quoted from the specification, with a link.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "vkInst_breakNote", "Put a breakpoint inside debugCallback, on the line that prints errors. When a message arrives, the debugger's call stack shows your function that made the bad call, one frame below the layer's code. This is the fastest way to find a bug, much faster than reading the message and searching the source.")}
      </Callout>
      <p>
        {tx(t, "vkInst_vkconfigBody",
          "The validation layer has more checks than it runs by default, because some are slow. vkconfig, from the SDK, switches them on without touching your code: synchronization validation finds missing barriers (from the Synchronization chapter on, keep it on), best-practices validation warns about legal but slow usage, and GPU-assisted validation checks what shaders do with indices and descriptors while they run. vkconfig can also force the layer on for a program that does not request it.")}
      </p>

      <H2>{tx(t, "vkInst_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "vkInst_tMistake", "Mistake"), tx(t, "vkInst_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "vkInst_e1", "Forgetting sType, or copying the wrong one"), tx(t, "vkInst_e1b", "the driver misreads the struct. Always initialise with {} and set sType on the next line; the validation layer reports a wrong one.")],
          [tx(t, "vkInst_e2", "Calling vkCreateDebugUtilsMessengerEXT directly"), tx(t, "vkInst_e2b", "a link error: the loader library does not export this extension's functions. Load it with vkGetInstanceProcAddr, or use the volk meta-loader, which loads every function pointer for you.")],
          [tx(t, "vkInst_e3", "Requesting the validation layer unconditionally"), tx(t, "vkInst_e3b", "vkCreateInstance fails with VK_ERROR_LAYER_NOT_PRESENT on every machine without the SDK. Check first, and only in debug builds.")],
          [tx(t, "vkInst_e4", "Forgetting the surface extensions"), tx(t, "vkInst_e4b", "creating the window surface fails in the swapchain chapter. Always start from SDL_Vulkan_GetInstanceExtensions.")],
          [tx(t, "vkInst_e5", "Returning VK_TRUE from the callback"), tx(t, "vkInst_e5b", "the call that triggered the message fails with VK_ERROR_VALIDATION_FAILED_EXT, changing the program's behaviour in debug builds only. Return VK_FALSE.")],
          [tx(t, "vkInst_e6", "Ignoring warnings because \"it runs\""), tx(t, "vkInst_e6b", "every validation error is a bug, even when the picture looks right. Keep the output clean from the first chapter on; it is much harder to clean up later.")],
        ]}
      />

      <KeyIdeas t={t} id="vkInst" items={[
        "The program links against the loader, which finds the installed drivers (ICDs) and routes each call to the right one.",
        "Layers sit between loader and driver; VK_LAYER_KHRONOS_validation checks every call against the specification's Valid Usage rules.",
        "The driver checks nothing: during development the validation layer is mandatory, and a correct program produces no messages.",
        "VkApplicationInfo.apiVersion is the highest version you will use; the loader's version is checked here, each GPU's in the next chapter.",
        "Surface extensions come from SDL_Vulkan_GetInstanceExtensions; VK_EXT_debug_utils adds the messenger.",
        "Lists are read with the two-call idiom: count, allocate, fill.",
        "Extension functions are loaded with vkGetInstanceProcAddr; a messenger create-info in the instance's pNext also covers instance creation.",
        "Destroy in reverse: messenger, instance, window.",
      ]} />
    </Article>
  );
}
