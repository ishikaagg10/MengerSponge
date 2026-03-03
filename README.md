Names: Ishika Aggarwal and Venkata Phani (Sri) Kesiraju

Extra Credit:

1. Projected Shadow
We implemented a projected shadow of the Menger sponge onto the floor by creating a custom set of vertex and fragment shaders. It calculates a ray from the light position through each vertex. It then finds where that ray intersects the ground and flattens the geometry there. This is automatically rendered every time, so no additional steps need to be taken to render the projected shadow.