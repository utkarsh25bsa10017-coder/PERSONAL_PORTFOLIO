/*
 * GhostCursor lib shim — loads three.js + the postprocessing passes the official
 * React Bits GhostCursor component needs, and exposes them as globals for the
 * babel-transpiled js/GhostCursor.jsx (this project has no bundler).
 * `three` is resolved locally via the importmap declared in index.html.
 */
import * as THREE from 'three';
import { EffectComposer } from './three-vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './three-vendor/postprocessing/RenderPass.js';
import { ShaderPass } from './three-vendor/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './three-vendor/postprocessing/UnrealBloomPass.js';

window.GhostCursorLib = { THREE, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass };
window.dispatchEvent(new Event('ghostcursor-lib-ready'));
