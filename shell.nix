{ pkgs ? import <nixpkgs> {} }:

let
  # TODO: This should be set to the correct path for your system
  NPM_CONFIG_PREFIX = "~/Documents/Development/Node/npm_config";
in pkgs.mkShell {
  packages = with pkgs; [
    nodejs
    nodePackages.npm
  ];

  inherit NPM_CONFIG_PREFIX;

  shellHook = ''
    export PATH="${NPM_CONFIG_PREFIX}/bin:$PATH"
  '';
}