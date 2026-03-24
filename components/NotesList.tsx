import React, { useState, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Note } from "../lib/types";
import NoteInput from "./NoteInput";

interface Props {
  notes: Note[];
  onAdd: (text: string) => void;
  onUpdate: (id: number, text: string) => void;
  onDelete: (id: number) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default memo(function NotesList({
  notes,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    const trimmed = editText.trim();
    if (trimmed) {
      onUpdate(editingId, trimmed);
    }
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(id) },
    ]);
  };

  const renderNote = ({ item }: { item: Note }) => {
    const isEditing = editingId === item.id;

    if (isEditing) {
      return (
        <View key={item.id} style={styles.noteCard}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={saveEdit} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelEdit} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View key={item.id} style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteDate}>{formatDate(item.created_at)}</Text>
          <View style={styles.noteActions}>
            <TouchableOpacity
              onPress={() => startEdit(item)}
              style={styles.actionBtn}
            >
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDelete(item.id)}
              style={styles.actionBtn}
            >
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.noteText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notes</Text>

      <NoteInput onAdd={onAdd} />

      <ScrollView
        style={styles.list}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {notes.length === 0 ? (
          <Text style={styles.emptyText}>What are you thinking?</Text>
        ) : (
          notes.map((note: Note) => renderNote({ item: note }))
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 12,
    flex: 1,
    minHeight: 200,
  },
  header: {
    fontSize: 14,
    fontWeight: "700",
    color: "#BB86FC",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  noteCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    marginBottom: 10,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 11,
    color: "#64B5F6",
    fontWeight: "600",
  },
  noteActions: {
    flexDirection: "row",
  },
  actionBtn: {
    padding: 4,
    marginLeft: 8,
  },
  editIcon: {
    fontSize: 16,
    color: "#888",
  },
  deleteIcon: {
    fontSize: 16,
    color: "#888",
  },
  noteText: {
    fontSize: 14,
    color: "#E0E0E0",
    lineHeight: 20,
  },
  editInput: {
    backgroundColor: "#111",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#444",
    color: "#E0E0E0",
    fontSize: 14,
    lineHeight: 20,
    padding: 10,
    minHeight: 60,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: "#BB86FC",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  cancelBtnText: {
    color: "#888",
    fontSize: 13,
  },
  emptyText: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    paddingTop: 8,
    fontStyle: "italic",
  },
});
