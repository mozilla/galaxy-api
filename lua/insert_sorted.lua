local count = redis.call("ZCARD", KEYS[1])
local curPosition = redis.call("ZSCORE", KEYS[1], ARGV[1])

-- if game is not yet featured
if curPosition == false then
	local items = redis.call("ZRANGEBYSCORE", KEYS[1], ARGV[2], count)
	for i, item in ipairs(items) do
		redis.call("ZINCRBY", KEYS[1], 1, item)
	end
	return redis.call("ZADD", KEYS[1], ARGV[2], ARGV[1])
-- if game is already featured
else
	if curPosition > ARGV[2] then
		local items = redis.call("ZRANGEBYSCORE", KEYS[1], ARGV[2], curPosition - 1)
		for i, item in ipairs(items) do
			redis.call("ZINCRBY", KEYS[1], 1, item)
		end
	elseif curPosition < ARGV[2] then
		local items = redis.call("ZRANGEBYSCORE", KEYS[1], curPosition + 1, ARGV[2])
		for i, item in ipairs(items) do
			redis.call("ZINCRBY", KEYS[1], -1, item)
		end
	end
	return redis.call("ZINCRBY", KEYS[1], ARGV[2] - curPosition, ARGV[1])
end
