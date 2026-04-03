import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Star } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { Button } from './Button';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => Promise<void>;
  targetName: string;
}

export function ReviewForm({ onSubmit, targetName }: ReviewFormProps) {
  const { colors } = useTheme();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(rating, comment);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { borderColor: colors.text, backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Rate {targetName}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>How was the experience?</Text>
      
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity key={i} onPress={() => setRating(i)}>
            <Star 
              size={32} 
              color={i <= rating ? colors.accent : colors.muted} 
              fill={i <= rating ? colors.accent : 'transparent'} 
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.inputBox, { borderColor: colors.text }]}>
        <TextInput
          placeholder="Leave a comment..."
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
          multiline
          numberOfLines={3}
          value={comment}
          onChangeText={setComment}
          maxLength={200}
        />
      </View>

      <Button 
        title="SUBMIT REVIEW" 
        onPress={handleSubmit} 
        loading={loading}
        disabled={!comment.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 4,
    padding: DT.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    marginVertical: DT.spacing.md,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: DT.typography.body,
    fontSize: 14,
    marginBottom: DT.spacing.lg,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: DT.spacing.xl,
    justifyContent: 'center',
  },
  inputBox: {
    borderWidth: 3,
    padding: 12,
    marginBottom: DT.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  input: {
    fontFamily: DT.typography.body,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  }
});
