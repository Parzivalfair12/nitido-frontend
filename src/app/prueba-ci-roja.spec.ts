describe('prueba de CI en rojo', () => {
  it('falla a propósito para comprobar que el CI frena el merge', () => {
    expect(1).toBe(2);
  });
});
