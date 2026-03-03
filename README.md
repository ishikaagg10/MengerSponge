Names: Ishika Aggarwal and Venkata Phani (Sri) Kesiraju

Extra Credit:

1. Projected Shadow
We implemented a projected shadow of the Menger sponge onto the floor by creating a custom set of vertex and fragment shaders. It calculates a ray from the light position through each vertex. It then finds where that ray intersects the ground and flattens the geometry there. This is automatically rendered every time, so no additional steps need to be taken to render the projected shadow.

2. Basic Animation (Grab and Spin/Throw)
We implemented an interactive animation where the user can grab and spin the Menger sponge. We implemented an update animation tick to calculate inertia. We converted the 2D mouse drag delta into a 3D vector and calculated a cross-product to determine the exact axis of rotation. To see this in action, hold the "Shift" key down and click and drag across the GUI to spin the sponge. Release the mouse while dragging to "throw" the cube, where the cube will spin with inertia until it comes to a stop.

3. Mountainous Terrain
We changed the checkerboard into a mountainous terrain. The terrain is procedurally generated in real time using a 2D Fractal Brownian Motion (FBM) noise function. There is also an elevation-based color map that transitions between green valleys, grey rocky slopes, and white snow caps depending on the fragment's calculated height. The mountainous terrain is automatically generated, so no additional steps need to be taken to render it.