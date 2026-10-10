// src/lib/tracks/opengl/chapters/advanced/buffers.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { addressNumbers } from "@/lib/tracks/opengl/live/buffers";
import { tx } from "@/lib/tracks/tx";
import { Goals } from "@/components/lesson/Prose";
import type { TrackTranslations } from "@/lib/tracks/types";

const r = String.raw;

// ── Buffer Data: update, map, copy ───────────────────────────────────────────

export function BufferDataContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglBuf_intro",
          "So far every buffer was filled once, whole, with glBufferData. Real programs also change part of a buffer, write into one through a pointer, lay out attributes in different ways and copy data from one buffer to another. None of this needs a new kind of object. A buffer is just a block of memory managed by OpenGL, and a handful of calls cover everything you will ever do to one."
        )}
      </p>

      <Goals t={t} id="oglBuf" items={[
        "Update part of a buffer with glBufferSubData.",
        "Write into a buffer through a mapped pointer.",
        "Choose between interleaved and batched attributes.",
        "Copy data between buffers on the GPU.",
      ]} />

      <H2>{tx(t, "oglBuf_targetsTitle", "Targets are only binding points")}</H2>
      <p>
        {tx(t, "oglBuf_targetsBody",
          "A buffer has no fixed type. GL_ARRAY_BUFFER, GL_ELEMENT_ARRAY_BUFFER, GL_UNIFORM_BUFFER and the others are binding points: slots that say which buffer a call operates on, and for draws, what the bound buffer is used for. The same buffer can be bound to one target to fill it and to another to use it. The compute chapter writes particles into a buffer as an SSBO and then draws the same buffer as vertex data."
        )}
      </p>

      <H2>{tx(t, "oglBuf_subTitle", "Changing part of a buffer: glBufferSubData")}</H2>
      <p>
        {tx(t, "oglBuf_subBody",
          "glBufferData always allocates new storage of the given size, and copies your data into it if you pass a pointer. Pass nullptr and it only allocates. glBufferSubData writes into storage that already exists, starting offset bytes from the beginning and covering size bytes. The range must fit: if offset + size is larger than the buffer, the call fails with GL_INVALID_VALUE and nothing is written."
        )}
      </p>
      <CodeBlock lang="cpp" filename="sub_data.cpp" t={t}>{`glBindBuffer(GL_ARRAY_BUFFER, vbo);

// Allocate 1 MB once, without filling it
glBufferData(GL_ARRAY_BUFFER, 1 << 20, nullptr, GL_DYNAMIC_DRAW);

// Later: overwrite 24 vertices starting at vertex 100
constexpr GLsizeiptr vertexSize = 8 * sizeof(float);          // xyz + normal + uv
glBufferSubData(GL_ARRAY_BUFFER,
                100 * vertexSize,                              // offset in bytes
                24 * vertexSize,                               // size in bytes
                newVertices);                                  // source in RAM`}</CodeBlock>

      <H2>{tx(t, "oglBuf_mapTitle", "Writing through a pointer: glMapBuffer")}</H2>
      <p>
        {tx(t, "oglBuf_mapBody",
          "glMapBuffer returns a pointer into the buffer's storage, as seen from your program. Whatever you write through it ends up in the buffer, with no intermediate array in RAM. That suits data you generate on the fly, such as a mesh built by a procedural generator or a file loader that decodes straight into place. glUnmapBuffer hands the storage back to OpenGL. Until then the buffer cannot be used for drawing, and the pointer is invalid afterwards."
        )}
      </p>
      <CodeBlock lang="cpp" filename="map.cpp" t={t}>{`glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, count * sizeof(Vertex), nullptr, GL_STATIC_DRAW);

// GL_WRITE_ONLY: we promise not to read, so the driver never copies the old contents to us
auto* dst = static_cast<Vertex*>(glMapBuffer(GL_ARRAY_BUFFER, GL_WRITE_ONLY));
generateTerrain(dst, count);                  // writes the vertices directly into the buffer

if (glUnmapBuffer(GL_ARRAY_BUFFER) == GL_FALSE) {
    // Rare: the contents were lost while mapped (e.g. a display mode change). Upload again.
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglBuf_mapRange",
          "glMapBufferRange maps only part of a buffer and takes access bits that say more precisely what you intend. GL_MAP_WRITE_BIT alone is the equivalent of GL_WRITE_ONLY. Adding GL_MAP_INVALIDATE_RANGE_BIT says the old contents of the range may be thrown away, so the driver has nothing to preserve. For data rewritten every frame, the flags and the synchronisation around them matter a great deal: the Buffer Streaming & Sync chapter covers that case."
        )}
      </Callout>

      <H2>{tx(t, "oglBuf_layoutTitle", "Interleaved or batched attributes")}</H2>
      <p>
        {tx(t, "oglBuf_layoutBody",
          "Until now each vertex stored all its attributes side by side: position, normal, uv, then the next vertex (interleaved). The same data can also be stored as one block per attribute: all positions, then all normals, then all uvs (batched). Both work with a single VBO. Only the two numbers at the end of glVertexAttribPointer change. The stride becomes the size of one element of that attribute alone, and the offset becomes the start of its block."
        )}
      </p>
      <LessonTable
        headers={[tx(t, "oglBuf_lH0", "Layout"), tx(t, "oglBuf_lH1", "Memory"), tx(t, "oglBuf_lH2", "Stride / offset of the normal")]}
        rows={[
          [tx(t, "oglBuf_l1", "Interleaved"), "P N T  P N T  P N T …", tx(t, "oglBuf_l1s", "8 floats / 3 floats")],
          [tx(t, "oglBuf_l2", "Batched"),     "P P P …  N N N …  T T T …", tx(t, "oglBuf_l2s", "3 floats / 3 floats × vertex count")],
        ]}
      />
      <CodeBlock lang="cpp" filename="batched.cpp" t={t}>{`// Three separate arrays from a loader, one VBO for all of them
const GLsizeiptr posBytes = n * sizeof(glm::vec3);
const GLsizeiptr nrmBytes = n * sizeof(glm::vec3);
const GLsizeiptr uvBytes  = n * sizeof(glm::vec2);

glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, posBytes + nrmBytes + uvBytes, nullptr, GL_STATIC_DRAW);
glBufferSubData(GL_ARRAY_BUFFER, 0,                   posBytes, positions.data());
glBufferSubData(GL_ARRAY_BUFFER, posBytes,            nrmBytes, normals.data());
glBufferSubData(GL_ARRAY_BUFFER, posBytes + nrmBytes, uvBytes,  uvs.data());

// stride = one element of that attribute; offset = where its block starts
// (with the VAO bound, and glEnableVertexAttribArray(0..2) as usual)
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(glm::vec3), (void*)0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(glm::vec3), (void*)posBytes);
glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, sizeof(glm::vec2), (void*)(posBytes + nrmBytes));`}</CodeBlock>
      <LiveFormula label={tx(t, "oglBuf_live", "Try it: at which byte does the GPU read this attribute?")}
        tex={r`\text{addr} = \text{offset} + i \cdot \text{stride}`}
        vars={[
          { id: "i", label: "i", min: 0, max: 999, step: 1, value: 100, fmt: v => String(v) },
          { id: "a", label: tx(t, "oglBuf_liveAttr", "attribute"), min: 0, max: 2, step: 1, value: 1,
            fmt: v => [tx(t, "oglBuf_livePos", "position"), tx(t, "oglBuf_liveNrm", "normal"), "uv"][v] },
          { id: "n", label: "n", min: 1000, max: 10000, step: 1000, value: 1000, fmt: v => String(v) },
        ]}
        where={[
          [r`i`, tx(t, "oglBuf_wI", "the vertex being read, from 0 to n − 1")],
          [r`\text{offset}`, tx(t, "oglBuf_wOff", "the last argument of glVertexAttribPointer: where the attribute's first element starts. Interleaved: 0, 12 or 24 inside the vertex. Batched: where its block starts, 0, 12n or 24n")],
          [r`\text{stride}`, tx(t, "oglBuf_wStride", "the bytes from one element to the next: 32, the whole vertex, when interleaved; 12 or 8, the attribute alone, when batched")],
          [r`n`, tx(t, "oglBuf_wN", "the number of vertices in the buffer; only the batched layout depends on it")],
        ]}
        compute={addressNumbers(t)}
        note={tx(t, "oglBuf_liveNote", "Vertex 100's normal: byte 3212 interleaved, right after its position at 3200 (the 100 × 32 of glBufferSubData above). Batched, it is at 13 200, past all 1000 positions. Change n and only the batched address moves.")} />
      <p>
        {tx(t, "oglBuf_layoutWhich",
          "Interleaved is the usual default: a vertex shader that reads every attribute finds them in one place in memory, so each cache line it fetches is fully used. Separate blocks win in two situations. When one attribute changes and the others do not, you can update just its block, for example positions every frame for a cloth simulation. And when a pass reads only some attributes, it fetches only those. A shadow or depth pre-pass needs positions only, so engines often keep positions in their own stream and everything else interleaved in a second one."
        )}
      </p>

      <H2>{tx(t, "oglBuf_copyTitle", "Copying between buffers: glCopyBufferSubData")}</H2>
      <p>
        {tx(t, "oglBuf_copyBody",
          "glCopyBufferSubData copies a range from one buffer to another, and the copy happens on the GPU: the data never comes back to the CPU. It takes two targets, one to read from and one to write to, but two buffers cannot both be bound to GL_ARRAY_BUFFER at once. That is what the GL_COPY_READ_BUFFER and GL_COPY_WRITE_BUFFER targets are for. They exist only to hold the two sides of a copy, so binding to them never disturbs the bindings your draws rely on."
        )}
      </p>
      <CodeBlock lang="cpp" filename="grow_buffer.cpp" t={t}>{`// Grow a buffer that ran out of room, keeping its contents
GLuint bigger;
glGenBuffers(1, &bigger);
glBindBuffer(GL_COPY_WRITE_BUFFER, bigger);
glBufferData(GL_COPY_WRITE_BUFFER, newSize, nullptr, GL_DYNAMIC_DRAW);

glBindBuffer(GL_COPY_READ_BUFFER, old);
glCopyBufferSubData(GL_COPY_READ_BUFFER, GL_COPY_WRITE_BUFFER,
                    0, 0, oldSize);                 // read offset, write offset, bytes
glDeleteBuffers(1, &old);                            // remember to re-point your VAO at 'bigger'

// DSA (4.5) needs no binding at all:
// glCopyNamedBufferSubData(old, bigger, 0, 0, oldSize);`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "oglBuf_copyWarn",
          "Both ranges must lie inside their buffers, and when a buffer is copied onto itself the source and destination ranges must not overlap; either mistake is GL_INVALID_VALUE and nothing is copied. Deleting the old buffer does not update the VAOs that pointed at it: call glVertexAttribPointer again (or glVertexArrayVertexBuffer with DSA) with the new buffer bound."
        )}
      </Callout>

      <LessonTable
        headers={[tx(t, "oglBuf_sH0", "Call"), tx(t, "oglBuf_sH1", "Does"), tx(t, "oglBuf_sH2", "Use it when")]}
        rows={[
          ["glBufferData",        tx(t, "oglBuf_s1d", "allocates new storage, optionally filled"), tx(t, "oglBuf_s1u", "creating a buffer, or resizing it (the old contents are lost)")],
          ["glBufferSubData",     tx(t, "oglBuf_s2d", "copies from RAM into part of existing storage"), tx(t, "oglBuf_s2u", "you already have the data in an array")],
          ["glMapBuffer(Range)",  tx(t, "oglBuf_s3d", "gives you a pointer into the storage"), tx(t, "oglBuf_s3u", "you generate the data, and can write it straight into place")],
          ["glCopyBufferSubData", tx(t, "oglBuf_s4d", "copies between buffers on the GPU"), tx(t, "oglBuf_s4u", "growing, duplicating, or moving data from a staging buffer")],
        ]}
      />

    </article>
  );
}
