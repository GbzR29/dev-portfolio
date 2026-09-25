"use client";

// SDL3 track — "Audio".

import { TrackTranslations } from "@/lib/tracks/types";
import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";

export function AudioContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "sdl08_intro",
          "SDL3 rewrote audio around streams. In SDL2 you opened a device in one specific format and converted everything yourself; in SDL3 you open a stream, tell it the format your data is in, and SDL converts and resamples on the way to the device. Several streams can feed the same device and SDL mixes them."
        )}
      </p>

      <H2>{tx(t, "sdl08_conceptTitle", "Streams, devices and logical devices")}</H2>
      <p>
        {tx(t, "sdl08_conceptBody",
          "A physical device is the sound card. A logical device is your program's handle on it, and several can be open at once without fighting. A stream is a queue with format conversion built in: you push samples in your format, SDL pulls them in the device's format."
        )}
      </p>

      <CodeBlock lang="cpp" filename="audio_wav.cpp" t={t}>{`SDL_Init(SDL_INIT_AUDIO);

// Load a WAV — SDL fills in whatever format the file happens to be
SDL_AudioSpec spec;
Uint8* buffer = nullptr;
Uint32 length = 0;
if (!SDL_LoadWAV("assets/shoot.wav", &spec, &buffer, &length)) {
    SDL_Log("LoadWAV: %s", SDL_GetError());
}

// Open a stream on the default device, in the file's format.
// SDL resamples to whatever the hardware wants — you never convert by hand.
SDL_AudioStream* stream =
    SDL_OpenAudioDeviceStream(SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, &spec, nullptr, nullptr);

SDL_ResumeAudioStreamDevice(stream);      // devices start paused

SDL_PutAudioStreamData(stream, buffer, int(length));   // fire and forget

// cleanup
SDL_DestroyAudioStream(stream);
SDL_free(buffer);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl08_pauseWarn",
          "SDL_OpenAudioDeviceStream returns a paused device. Forgetting SDL_ResumeAudioStreamDevice is the single most common reason for 'my audio code runs and nothing plays' — there is no error, the samples just queue up forever."
        )}
      </Callout>

      <H2>{tx(t, "sdl08_callbackTitle", "Generating audio in a callback")}</H2>
      <p>
        {tx(t, "sdl08_callbackBody",
          "For synthesized audio, pass a callback when opening the stream. SDL calls it from the audio thread whenever the stream needs more data — which means the usual audio-thread rules apply."
        )}
      </p>

      <CodeBlock lang="cpp" filename="audio_synth.cpp" t={t}>{`void SDLCALL feed(void* userdata, SDL_AudioStream* stream,
                  int additionalAmount, int totalAmount) {
    auto* osc = static_cast<Oscillator*>(userdata);
    const int samples = additionalAmount / int(sizeof(float));

    static float buf[4096];
    const int n = SDL_min(samples, 4096);
    for (int i = 0; i < n; ++i) buf[i] = osc->next();

    SDL_PutAudioStreamData(stream, buf, n * int(sizeof(float)));
}

SDL_AudioSpec spec{SDL_AUDIO_F32, 1, 48000};
SDL_AudioStream* stream = SDL_OpenAudioDeviceStream(
    SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, &spec, feed, &oscillator);
SDL_ResumeAudioStreamDevice(stream);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "sdl08_threadWarn",
          "The audio callback runs on a real-time thread with a hard deadline of a few milliseconds. No allocation, no mutex that a game thread might hold, no file I/O, no logging. Miss the deadline and the user hears a click. Communicate with a lock-free ring buffer or an atomic, and do the heavy work elsewhere."
        )}
      </Callout>

      <H2>{tx(t, "sdl08_mixTitle", "Mixing several sounds")}</H2>
      <p>
        {tx(t, "sdl08_mixBody",
          "You do not need a mixer for simple cases: bind several streams to the same logical device and SDL sums them. Gain is per stream, so a music stream and a sound-effect stream can have independent volume."
        )}
      </p>

      <CodeBlock lang="cpp" filename="mixing.cpp" t={t}>{`SDL_AudioDeviceID dev =
    SDL_OpenAudioDevice(SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, nullptr);

SDL_AudioStream* music = SDL_CreateAudioStream(&musicSpec, nullptr);
SDL_AudioStream* sfx   = SDL_CreateAudioStream(&sfxSpec,   nullptr);

SDL_BindAudioStream(dev, music);
SDL_BindAudioStream(dev, sfx);      // SDL mixes both into the device

SDL_SetAudioStreamGain(music, 0.35f);
SDL_SetAudioStreamGain(sfx,   1.00f);
SDL_ResumeAudioDevice(dev);`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "sdl08_mixerTip",
          "For a real game, SDL3_mixer gives you MP3, OGG and FLAC decoding, a channel model, fades and looping on top of all this. Core SDL audio is the right layer when you are synthesizing sound or building your own mixer; SDL3_mixer is the right layer when you just want to play the assets an audio designer handed you."
        )}
      </Callout>

    </article>
  );
}
