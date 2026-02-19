import React from "react";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { initDatabase, DATABASE_NAME } from "../lib/database";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#0A0A0A" />
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0A0A0A" },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="settings"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </SQLiteProvider>
    </>
  );
}
