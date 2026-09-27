// src/lib/tracks/glsl/chapters/effects/ocean.tsx
"use client";

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { SpectrumFigure } from "@/components/lesson/figures/ocean/SpectrumFigure";
import { OceanLabFigure } from "@/components/lesson/figures/ocean/OceanLabFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Ocean: FFT waves
// ═════════════════════════════════════════════════════════════════════════════

export function OceanContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslOcean_intro",
          "The Water Lab sums eight Gerstner waves. Watch it for a minute and the pattern gives itself away: the same few crests, marching in the same few directions. A real sea is the sum of countless waves of every length, each with a random phase, and oceanographers have measured how their energy is shared out. This chapter builds the method behind the oceans of most modern games, from Tessendorf's 2001 course notes: draw a random sea with the measured statistics, evaluate 65,536 waves per tile with a fast Fourier transform on the GPU every frame, and keep foam where waves break.")}
      </Lead>

      <H2>{tx(t, "glslOcean_specTitle", "The sea as a spectrum")}</H2>
      <p>
        {tx(t, "glslOcean_specBody",
          "Record the height of the sea at one spot for an hour, and it looks like noise. Split that record into sine waves (a Fourier analysis), and a clear shape appears. Almost all the energy sits in a band of frequencies around a peak, and the peak depends on the wind. That shape is the spectrum S(ω): how much of the height's variance comes from waves near each angular frequency ω. Its integral is the total variance, and the significant wave height Hs, the height sailors report, is four times its square root:")}
      </p>
      <Equation label={tx(t, "glslOcean_varLabel", "Variance, and the significant wave height")}
        where={[
          [r`S(\omega)`, tx(t, "glslOcean_wS", "the spectrum, in m²·s: variance of the height per unit of angular frequency")],
          [r`\sigma^2`, tx(t, "glslOcean_wVar", "the variance of the surface height around its mean, in m²")],
          [r`H_s`, tx(t, "glslOcean_wHs", "significant wave height: about the mean height of the highest third of the waves, which is what an observer on a ship estimates")],
        ]}>
        {r`\sigma^2 = \int_0^\infty S(\omega)\,d\omega \qquad H_s = 4\,\sigma`}
      </Equation>
      <p>
        {tx(t, "glslOcean_jonBody",
          "The North Sea measurements of the JONSWAP project (1973) gave the shape most games use. It needs only two inputs: the wind speed U, measured 10 m above the water, and the fetch F, the distance over which that wind has been blowing across open water. A short fetch means a young sea, whose waves have not had time to grow:")}
      </p>
      <Equation label={tx(t, "glslOcean_jonLabel", "The JONSWAP spectrum")}
        where={[
          [r`g`, tx(t, "glslOcean_wG", "gravity, 9.81 m/s². It is what pulls a raised crest back down, so it sets how fast waves travel")],
          [r`\omega_p = 22\,\big(g^2/(U F)\big)^{1/3}`, tx(t, "glslOcean_wWp", "the peak frequency. More wind or more fetch lowers it: the dominant waves get longer and faster. Past g·F/U² ≈ 2.2·10⁴ the sea is fully developed and a longer fetch changes nothing")],
          [r`\alpha = 0.076\,\big(U^2/(F g)\big)^{0.22}`, tx(t, "glslOcean_wAlpha", "the overall level (Phillips' constant). It grows with wind speed and shrinks as the sea matures")],
          [r`\omega^{-5}\,e^{-\frac54(\omega_p/\omega)^4}`, tx(t, "glslOcean_wPM", "the Pierson–Moskowitz shape of a fully grown sea. The exponential cuts off frequencies below the peak, and the ω⁻⁵ tail is the short waves, which break as soon as they get steep, so their energy is capped")],
          [r`\gamma^{\,r}`, tx(t, "glslOcean_wGamma", "the peak enhancement. γ = 3.3 on average, and γ = 1 removes it. The exponent r is 1 at the peak and falls off quickly, so only the peak is raised: a growing sea concentrates its energy there")],
          [r`\sigma_J`, tx(t, "glslOcean_wSigJ", "the width of that bump: 0.07 below the peak, 0.09 above it")],
        ]}>
        {r`S(\omega) = \frac{\alpha\,g^2}{\omega^5}\,\exp\!\Big(\!-\tfrac54\big(\tfrac{\omega_p}{\omega}\big)^4\Big)\;\gamma^{\,r} \qquad r = \exp\!\Big(\!-\frac{(\omega-\omega_p)^2}{2\,\sigma_J^2\,\omega_p^2}\Big)`}
      </Equation>
      <SpectrumFigure t={t} />
      <Callout type="info" t={t}>
        {tx(t, "glslOcean_shortNote", "JONSWAP was fitted to the energetic waves near the peak, and its ω⁻⁵ tail underestimates the short ones. Cox and Munk (1954) measured the slopes of the real sea from photographs of sun glitter: the mean square slope is about 0.003 + 0.00512·U, two to three times what the tail predicts. Short waves carry most of the slope, and slope is what the eye sees in reflections and foam. So the Ocean Lab has a 'short waves ×' slider that scales the amplitude of waves much shorter than the peak (from 1.5 to 6 times the peak wave number), and shows the simulated mean square slope next to Cox and Munk's value.")}
      </Callout>

      <H2>{tx(t, "glslOcean_2dTitle", "From frequencies to a 2D sea")}</H2>
      <p>
        {tx(t, "glslOcean_2dBody",
          "S(ω) describes a single point. A surface also needs a direction for each wave, and the simulation works with wave vectors k rather than frequencies. Three facts connect them. In deep water, a wave's frequency follows from its wavelength alone. The wind spreads the energy over directions around its own. And a change of variables keeps the total variance the same:")}
      </p>
      <Equation label={tx(t, "glslOcean_dispLabel", "Dispersion, spreading, and the wave-number spectrum")}
        where={[
          [r`\mathbf k = (k_x, k_z),\ k = \lVert\mathbf k\rVert`, tx(t, "glslOcean_wK", "the wave vector: it points where the wave travels, and k = 2π/λ")],
          [r`\omega = \sqrt{g k}`, tx(t, "glslOcean_wDisp", "deep-water dispersion: a wave four times as long travels twice as fast. It holds while the depth exceeds about half a wavelength")],
          [r`D(\theta)`, tx(t, "glslOcean_wD", "the share of energy travelling at angle θ, with θ_w the wind direction. cos²ˢ((θ − θ_w)/2) is largest downwind and 0 upwind. The exponent s is the alignment slider: 5 for a wind sea, 30 or more for a long, orderly swell. N_s scales it so that D integrates to 1 over all angles")],
          [r`\frac{d\omega}{dk}\,\frac1k`, tx(t, "glslOcean_wJac", "the change of variables. S(ω) dω counts variance per band of frequency, and S(k) dkx dkz per patch of the k plane. A ring of the k plane of radius k and width dk has area k dk dθ, and dω = (dω/dk) dk with dω/dk = g/(2ω)")],
        ]}>
        {r`\omega = \sqrt{g\,k} \qquad D(\theta) = N_s \cos^{2s}\!\Big(\frac{\theta - \theta_w}{2}\Big) \qquad S(k_x, k_z) = S(\omega)\,D(\theta)\,\frac{d\omega}{dk}\,\frac1k`}
      </Equation>
      <p>
        {tx(t, "glslOcean_randBody",
          "Now make one random sea with those statistics. The tile is N × N texels (N = 256) covering L × L metres, so the allowed wave vectors form a grid with spacing Δk = 2π/L. Each one gets a complex amplitude made from two independent Gaussian random numbers. The modulus sets the wave's height and the angle sets its phase, and both come out random with exactly the right average:")}
      </p>
      <Equation label={tx(t, "glslOcean_h0Label", "The initial amplitudes")}
        where={[
          [r`\xi_r,\ \xi_i`, tx(t, "glslOcean_wXi", "independent standard Gaussian numbers (mean 0, variance 1), drawn once per wave vector with a fixed seed so the sea does not reshuffle")],
          [r`\Delta k = 2\pi/L`, tx(t, "glslOcean_wDk", "the spacing of the k grid. Each texel stands for a Δk × Δk patch of the spectrum, so it carries the variance S·Δk²")],
          [r`\tfrac12`, tx(t, "glslOcean_wHalf", "each real wave appears twice in the sum, at k and at −k, and the two halves must share its variance: E|h̃₀|² = S·Δk²/2")],
        ]}
        glsl={`float a = sqrt(S) * dk / 2.0;\nh0 = vec2(gaussR, gaussI) * a;`}>
        {r`\tilde h_0(\mathbf k) = \frac{\xi_r + i\,\xi_i}{2}\,\sqrt{S(\mathbf k)}\;\Delta k`}
      </Equation>

      <H2>{tx(t, "glslOcean_animTitle", "Animating: one rotation per wave")}</H2>
      <p>
        {tx(t, "glslOcean_animBody",
          "Each wave moves on its own. Its complex amplitude just rotates in the complex plane at its angular frequency ω, so animating the whole sea costs one complex multiplication per texel per frame. The height is then the sum of every wave:")}
      </p>
      <Equation label={tx(t, "glslOcean_evoLabel", "The spectrum at time t, and the surface it describes")}
        where={[
          [r`e^{-i\omega t}`, tx(t, "glslOcean_wRot", "a rotation by −ωt: together with e^(ik·x) it makes the crest move along +k at speed ω/k")],
          [r`\overline{\tilde h_0(-\mathbf k)}\,e^{\,i\omega t}`, tx(t, "glslOcean_wConj", "the complex conjugate of the amplitude at −k, turning the other way. It makes the coefficient at −k the conjugate of the one at k, and a sum made of such pairs is a real number: a height")],
          [r`e^{\,i\,\mathbf k\cdot\mathbf x}`, tx(t, "glslOcean_wWave", "the wave itself: cos(k·x) + i·sin(k·x), a plane wave across the tile")],
        ]}>
        {r`\tilde h(\mathbf k, t) = \tilde h_0(\mathbf k)\,e^{-i\omega t} + \overline{\tilde h_0(-\mathbf k)}\,e^{\,i\omega t} \qquad h(\mathbf x, t) = \sum_{\mathbf k} \tilde h(\mathbf k, t)\;e^{\,i\,\mathbf k\cdot\mathbf x}`}
      </Equation>
      <p>
        {tx(t, "glslOcean_chopBody",
          "Sine waves look soft. As with Gerstner waves, the fix is to move points sideways toward the crests. Tessendorf's choppy displacement does it for every wave at once. Every derivative the shading needs is just as cheap: differentiating e^(ik·x) along x multiplies it by i·kx. So slopes and the Jacobian come from more spectra of the same kind, with no finite differences:")}
      </p>
      <Equation label={tx(t, "glslOcean_chopLabel", "Horizontal displacement, slopes and the Jacobian")}
        where={[
          [r`i\,\frac{\mathbf k}{k}`, tx(t, "glslOcean_wChop", "moves each point along the wave's direction by a copy of its height shifted a quarter period, so points on both sides slide toward the crest and away from the trough. It is the Gerstner orbit, for every wave. Tessendorf's notes write −i and take λ negative; the sign is folded in here so the slider stays positive")],
          [r`\lambda`, tx(t, "glslOcean_wLam", "the choppiness slider. At 0 the sea is a pure height field, and around 1 its crests are sharp. Much above that, crests fold over")],
          [r`i\,k_x,\ \ -\frac{k_x^2}{k},\ \ -\frac{k_x k_z}{k}`, tx(t, "glslOcean_wDer", "the multipliers giving ∂h/∂x, ∂Dx/∂x and ∂Dx/∂z (differentiating multiplies by i·kx, and i·i = −1). Swapping x and z gives the rest")],
          [r`J`, tx(t, "glslOcean_wJ", "the Jacobian determinant of x ↦ x + λD, exactly as in the Water Lab: below 0 the surface has folded, and that is where the foam will go")],
        ]}>
        {r`\mathbf D(\mathbf x, t) = \sum_{\mathbf k} i\,\frac{\mathbf k}{k}\,\tilde h\,e^{\,i\,\mathbf k\cdot\mathbf x} \qquad \mathbf P = \mathbf x + \lambda\,\mathbf D \qquad J = \Big(1 + \lambda\frac{\partial D_x}{\partial x}\Big)\Big(1 + \lambda\frac{\partial D_z}{\partial z}\Big) - \Big(\lambda\frac{\partial D_x}{\partial z}\Big)^2`}
      </Equation>

      <H2>{tx(t, "glslOcean_fftTitle", "The fast Fourier transform")}</H2>
      <p>
        {tx(t, "glslOcean_fftBody",
          "Evaluated directly, the sum costs N² terms for each of the N² texels: 65,536 × 65,536 ≈ 4.3 billion complex multiplications per field per frame. The FFT finds the same N² values in about N²·log₂N steps. It splits an N-point sum into two N/2-point sums, over the even and the odd terms, and halves again until single terms remain. Each level recombines pairs with a butterfly:")}
      </p>
      <Equation label={tx(t, "glslOcean_bflyLabel", "One butterfly (an inverse transform)")}
        where={[
          [r`n`, tx(t, "glslOcean_wSize", "the size of the sub-transforms being built at this stage: 2, 4, 8 … N. There are log₂N = 8 stages per direction")],
          [r`E,\ O`, tx(t, "glslOcean_wEO", "the two halves from the previous stage: the transforms of the even-indexed and the odd-indexed inputs")],
          [r`W = e^{\,2\pi i\,j/n}`, tx(t, "glslOcean_wTw", "the twiddle factor. It shifts the odd half's phase, since those terms sit one sample further along. The sign is + because the sea is built from its spectrum: an inverse transform")],
        ]}
        note={tx(t, "glslOcean_bflyNote", "This is the Stockham form: every stage reads from one texture and writes the next, in natural order, so each stage is one fragment shader pass with no bit-reversal step. A 2D transform is 8 passes along rows, then 8 along columns.")}
        glsl={`float ev = floor(j / n) * (n / 2.0) + mod(j, n / 2.0);\nvec2 E = texelFetch(src, ivec2(ev, y), 0).xy;\nvec2 O = texelFetch(src, ivec2(ev + N / 2.0, y), 0).xy;\nfloat a = 2.0 * PI * j / n;\nout = E + cmul(vec2(cos(a), sin(a)), O);`}>
        {r`X_j = E_{j \bmod n/2} + W\,O_{j \bmod n/2}, \qquad W = e^{\,2\pi i\,j/n}`}
      </Equation>
      <p>
        {tx(t, "glslOcean_packBody",
          "The shading needs eight real fields: h, Dx, Dz, the two slopes and the three displacement derivatives. Every one of them is real, and the transform of a real field is conjugate-symmetric. So two fields a and b can travel as one complex spectrum ã + i·b̃, and the result comes out as a + i·b, with a in the real part and b in the imaginary part. Four complex fields fit in two RGBA32F textures, written at once with multiple render targets. One last detail: the spectrum texture keeps k = 0 in its middle (index N/2) so that negative frequencies have somewhere to go. That offset multiplies every output by e^(iπ(x + z)) = ±1, so the final pass flips the sign of every other texel, like a checkerboard.")}
      </p>

      <H2>{tx(t, "glslOcean_cascTitle", "Cascades")}</H2>
      <p>
        {tx(t, "glslOcean_cascBody",
          "One tile holds wavelengths from L down to two texels, 2L/N. A single 500 m tile would stop at 4 m waves. A 14 m tile would repeat so often that the eye catches it at once. So the lab runs three tiles, each keeping only its own band of wavelengths, so that no wave is drawn twice. Their sizes have no simple ratio, so their repeats never line up:")}
      </p>
      <LessonTable
        headers={[tx(t, "glslOcean_thTile", "tile L"), tx(t, "glslOcean_thTexel", "texel"), tx(t, "glslOcean_thBand", "wavelengths it keeps"), tx(t, "glslOcean_thRole", "what it makes")]}
        rows={[
          ["500 m", "2 m", "500 m … 20 m", tx(t, "glslOcean_role0", "the swell and the big wind waves")],
          ["83 m", "0.32 m", "20 m … 3.3 m", tx(t, "glslOcean_role1", "the chop riding on them")],
          ["13.7 m", "5 cm", "3.3 m … 0.1 m", tx(t, "glslOcean_role2", "ripples: they only bend the normal")],
        ]} />

      <OceanLabFigure t={t} />

      <H2>{tx(t, "glslOcean_foamTitle", "Foam that lingers")}</H2>
      <p>
        {tx(t, "glslOcean_foamBody",
          "In the Water Lab, foam exists only while J is small, and it vanishes the moment the crest passes. Real whitecaps leave a trail: a patch of bubbles that drifts with the water and fades over several seconds. That needs memory. One foam texture over the largest tile is kept from one frame to the next, and every frame does this:")}
      </p>
      <Equation label={tx(t, "glslOcean_accLabel", "Foam injection and decay, per texel per frame")}
        where={[
          [r`f`, tx(t, "glslOcean_wF", "the foam density, 0 … 1, stored in the tile's own texels. Those texels belong to rest positions x₀, so the foam moves with the water it sits on")],
          [r`e^{-\Delta t/\tau}`, tx(t, "glslOcean_wTau", "the decay over one frame of Δt seconds. After τ seconds (the lifetime slider) a patch is down to e⁻¹ ≈ 37% of its density")],
          [r`J_b,\ g`, tx(t, "glslOcean_wJb", "where injection starts (the 'foam below J =' slider) and how fast it saturates: fresh foam is 1 once J drops to J_b − 1/g. J is that of the summed surface of all three cascades, read at a resolution that matches a foam texel")],
          [r`\max`, tx(t, "glslOcean_wMax", "a breaking crest sets the density at once. Anywhere else the old foam just keeps fading")],
        ]}
        glsl={`float inject = clamp((bias - J) * gain, 0.0, 1.0);\nfoam = max(prevFoam * exp(-dt / tau), inject);`}>
        {r`f \leftarrow \max\!\Big(f\,e^{-\Delta t/\tau},\ \ \operatorname{clamp}\big((J_b - J)\,g,\ 0,\ 1\big)\Big)`}
      </Equation>
      <p>
        {tx(t, "glslOcean_patBody",
          "A density is not yet foam: a patch at f = 0.3 is not a pale grey smear but 30% white, in a pattern. Bubbles gather where cells of water meet, so the pattern is the Voronoi border distance F₂ − F₁ (from the Shore Lab), warped by noise so the cells are not polygons, at two sizes, plus a fine grain. A pixel is white where that pattern exceeds 1 − f. Low densities leave thin webs along the borders, and high densities fill whole patches. Far away the cells are smaller than a pixel, so the shader uses their average instead, which is f itself. Under the foam, the water also turns lighter and more turquoise, because the bubbles below the surface scatter light back up through it.")}
      </p>
      <Equation label={tx(t, "glslOcean_patLabel", "From density to white")}
        where={[
          [r`p(\mathbf x)`, tx(t, "glslOcean_wP", "the foam pattern, 0 … 1: highest on the cell borders, lowest in the middle of the cells")],
          [r`0.2`, tx(t, "glslOcean_wSoft", "the softness of the edge, in pattern units: white fades in over this range instead of switching on in one pixel")],
        ]}>
        {r`\text{white} = \operatorname{smoothstep}\big(1 - f,\ 1 - f + 0.2,\ p(\mathbf x)\big)`}
      </Equation>

      <H3>{tx(t, "glslOcean_filtTitle", "Filtering with distance")}</H3>
      <p>
        {tx(t, "glslOcean_filtBody",
          "The ring mesh from the Water Lab carries the displacement, and the same rule applies to what it can show. Every simulated texture gets mipmaps each frame. The vertex shader reads the displacement at the mip level whose texels are two vertex gaps wide, log₂(2·Δ·N/L) where Δ is the local vertex spacing, so waves the mesh cannot carry are averaged away instead of aliasing. The fragment shader lets the hardware pick the level from the pixel footprint, so distant normals and foam are averages rather than noise. The sun glint's roughness grows with distance to put back the brightness those averages remove.")}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "glslOcean_tip", "Engines do the same work in compute shaders, often at N = 512 with four cascades, and add a swell spectrum next to the wind sea. The foam texture is also advected by the currents, and a second sea state blends in when the weather changes. WebGL2 has no compute shaders, so every FFT stage here is a full-screen draw into a 256 × 256 texture: about sixty tiny passes per frame (19 per cascade) plus the foam, around a millisecond on a desktop GPU.")}
      </Callout>

      <KeyIdeas t={t} id="glslOcean" items={[
        tx(t, "glslOcean_k1", "A wind sea is a random sum of waves whose variance per frequency follows a measured spectrum. JONSWAP needs only the wind speed U and the fetch F, and Hs = 4·√(area under S)."),
        tx(t, "glslOcean_k2", "Each texel of an N × N tile is one wave vector. Its amplitude is a Gaussian random number scaled by √S·Δk/2, and its phase rotates at ω = √(gk)."),
        tx(t, "glslOcean_k3", "Heights, choppy displacement, slopes and Jacobian terms are all spectra multiplied by simple factors of k, turned into surfaces by the same inverse FFT: 2·log₂N Stockham passes."),
        tx(t, "glslOcean_k4", "Three cascades of unrelated sizes cover 500 m swells down to 10 cm ripples without visible repetition, each keeping only its own band."),
        tx(t, "glslOcean_k5", "Foam is a density with memory: injected where J drops below a threshold, decayed by e^(−Δt/τ), and drawn by thresholding a web-like pattern at 1 − f."),
      ]} />
    </Article>
  );
}
